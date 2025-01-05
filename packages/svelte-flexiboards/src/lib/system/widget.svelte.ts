import { getContext, onDestroy, setContext, type Component, type Snippet } from "svelte";
import { getFlexitargetCtx, type FlexiTarget, type FlexiTargetConfiguration } from "./target.svelte.js";
import type { GrabbedWidget } from "./types.js";
import { getFlexiwidgetwrapperCtx } from "./utils.svelte.js";

export type FlexiWidgetChildrenSnippet = Snippet<[{ widget: FlexiWidget, Component?: Component }]>;

export type FlexiWidgetClassFunction = (widget: FlexiWidget) => string;

export type FlexiWidgetClasses = string | {
    /**
     * The base class name for the widget.
     */
    default: string;

    /**
     * The class name that is added when the widget is being grabbed.
     */
    grabbed?: string;

    /**
     * The class name that is added when the widget is a shadow widget.
     */
    shadow?: string;
} | FlexiWidgetClassFunction;

export type FlexiWidgetDefaults = {
    draggable?: boolean;
    resizable?: boolean;
    width?: number;
    height?: number;
    snippet?: FlexiWidgetChildrenSnippet;
    component?: Component;
    className?: FlexiWidgetClasses;
};

export type FlexiWidgetConfiguration = FlexiWidgetDefaults & {
    x?: number;
    y?: number;
};

type FlexiWidgetState = {
    grabbed: GrabbedWidget | null;
    width: number;
    height: number;
    x: number;
    y: number;
}

type FlexiWidgetDerivedConfiguration = {

    /**
     * The component that is rendered by this item. This is optional if a snippet is provided.
     */
    component?: Component;

    /**
     * The snippet that is rendered by this widget. This is optional when a component is provided. If used alongside component, then this snippet is passed the component and should render it.
     */
    snippet?: FlexiWidgetChildrenSnippet;

    /**
     * Whether the item is resizable.
     */
    resizable: boolean;

    /**
     * Whether the item is draggable.
     */
    draggable: boolean;

    /**
     * The class name that is applied to this widget.
     */
    className?: FlexiWidgetClasses;
}

export class FlexiWidget {
    /**
     * The target that this widget belongs to.
     */
    target?: FlexiTarget = $state(undefined);

    #providerWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.providerWidgetDefaults);
    #targetWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.config.widgetDefaults);
    #rawConfig: FlexiWidgetConfiguration = $state({});

    /**
     * The reactive configuration of the widget. When these properties are changed, either due to a change in the widget's configuration,
     * or a change in the target's, or the board's, they will be updated to reflect the new values.
     */
    #config: FlexiWidgetDerivedConfiguration = $derived({
        component: this.#rawConfig.component ?? this.#targetWidgetDefaults?.component ?? this.#providerWidgetDefaults?.component,
        snippet: this.#rawConfig.snippet ?? this.#targetWidgetDefaults?.snippet ?? this.#providerWidgetDefaults?.snippet,
        resizable: this.#rawConfig.resizable ?? this.#targetWidgetDefaults?.resizable ?? this.#providerWidgetDefaults?.resizable ?? false,
        draggable: this.#rawConfig.draggable ?? this.#targetWidgetDefaults?.draggable ?? this.#providerWidgetDefaults?.draggable ?? true,
        className: this.#rawConfig.className ?? this.#targetWidgetDefaults?.className ?? this.#providerWidgetDefaults?.className
    });

    /**
     * Stores the underlying state of the widget. This differs to the derived config above, because it contains configuration items that
     * are only written to once when the widget is created. Properties stored in here do not react to changes in the config.
     */
    #state: FlexiWidgetState = $state({
        grabbed: null,
        width: 1,
        height: 1,
        x: 0,
        y: 0
    });

    isShadow: boolean = $state(false);

    grabbers: number = $state(0);

    style: string = $derived.by(() => {
        if(!this.grabbed) {
            return `grid-column: ${this.x + 1} / span ${this.width}; grid-row: ${this.y + 1} / span ${this.height};` +
                this.#getCursorStyle();
        }

        return `pointer-events: none; user-select: none; cursor: grabbing; position: absolute; top: ${this.grabbed.positionWatcher.position.y - this.grabbed.offsetY}px; left: ${this.grabbed.positionWatcher.position.x - this.grabbed.offsetX}px; height: ${this.grabbed.capturedHeight}px; width: ${this.grabbed.capturedWidth}px;`;
    })

    #getCursorStyle() {
        if(!this.draggable) {
            return '';
        }

        if(this.grabbed) {
            return 'pointer-events: none; user-select: none; cursor: grabbing;';
        }

        if(this.grabbers == 0) {
            return 'user-select: none; cursor: grab;';
        }

        return 'user-select: none;';
    }

    constructor(target: FlexiTarget, config: FlexiWidgetConfiguration, isShadow: boolean = false) {
        this.target = target;

        this.#rawConfig = config;

        // Populate the state proxy with the configuration values.
        this.width = config.width ?? 1;
        this.height = config.height ?? 1;

        this.isShadow = isShadow;

        // Allows the event handlers to be called without binding to the widget instance.
        this.onpointerdown = this.onpointerdown.bind(this);
        this.ongrabberpointerdown = this.ongrabberpointerdown.bind(this);
    }

    onpointerdown(event: PointerEvent) {
        if(!this.draggable || !event.target || this.grabbers) return;

        this.grabWidget(event.target as HTMLElement, event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    ongrabberpointerdown(event: PointerEvent) {
        if(!this.draggable || !event.target) return;

        this.grabWidget(event.target as HTMLElement, event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    grabWidget(element: HTMLElement, clientX: number, clientY: number) {
        const rect = element.getBoundingClientRect();

        // Get the offset of the cursor relative to the widget's bounds.
        const xOffset = clientX - rect.left;
        const yOffset = clientY - rect.top;

        // Propagate an event up to the parent target, indicating that the widget has been grabbed.
        this.grabbed = this.target.onwidgetgrabbed({
            widget: this,
            target: this.target,
            xOffset,
            yOffset,
            // Capture the current size of the widget so that we can fix this once it's moving.
            capturedHeight: rect.height,
            capturedWidth: rect.width
        });
    }

    setBounds(x: number, y: number, width: number, height: number) {
        this.#state.x = x;
        this.#state.y = y;
        this.#state.width = width;
        this.#state.height = height;
    }

    addGrabber() {
        this.grabbers++;

        return {
            onpointerdown: this.ongrabberpointerdown
        }
    }

    removeGrabber() {
        this.grabbers--;
    }

    // Getters and setters

    /**
     * When the widget is being grabbed, this contains information that includes its position, size and offset.
     * When this is null, the widget is not being grabbed.
     */
    get grabbed() {
        return this.#state.grabbed;
    }

    set grabbed(value: GrabbedWidget | null) {
        this.#state.grabbed = value;
    }

    /**
     * Whether the widget is draggable.
     */
    get draggable() {
        return this.#config.draggable;
    }

    set draggable(value: boolean) {
        this.#rawConfig.draggable = value;
    }

    /**
     * Whether the widget is resizable.
     */
    get resizable() {
        return this.#config.resizable;
    }

    set resizable(value: boolean) {
        this.#rawConfig.resizable = value;
    }

    /**
     * The width in units of the widget.
     */
    get width() {
        return this.#state.width;
    }

    // TODO: these shouldn't be exposed to the outside - the grid should manage these in some capacity
    set width(value: number) {
        this.#state.width = value;
    }

    /**
     * The height in units of the widget.
     */
    get height() {
        return this.#state.height;
    }

    set height(value: number) {
        this.#state.height = value;
    }

    /**
     * The component that is rendered by this widget.
     */
    get component() {
        return this.#config.component;
    }

    set component(value: Component | undefined) {
        this.#rawConfig.component = value;
    }

    /**
     * The snippet that is rendered by this widget.
     */
    get snippet() {
        return this.#config.snippet;
    }

    set snippet(value: FlexiWidgetChildrenSnippet | undefined) {
        this.#rawConfig.snippet = value;
    }

    /**
     * The class name that is applied to this widget.
     */
    get className() {
        return this.#config.className;
    }

    set className(value: FlexiWidgetClasses | undefined) {
        this.#rawConfig.className = value;
    }

    /**
     * Gets the column (x-coordinate) of the widget. This value is readonly and is managed by the target.
     */
    get x() {
        return this.#state.x;
    }

    /**
     * Gets the row (y-coordinate) of the widget. This value is readonly and is managed by the target.
     */
    get y() {
        return this.#state.y;
    }
}

const contextKey = Symbol('flexiwidget');

export function flexiwidget(config: FlexiWidgetConfiguration) {
    const target = getFlexitargetCtx();

    if(!target) {
        throw new Error("A FlexiWidget was instantiated outside of a FlexiTarget context. Ensure that flexiwidget() (or <FlexiWidget>) is called within a <FlexiTarget> component.");
    }

    let widget: FlexiWidget | undefined;
    if(!target.rendered) {
        widget = target.createWidget(config);
    } else {
        widget = getFlexiwidgetwrapperCtx();
        if(!widget) {
            throw new Error("A FlexiWidget was instantiated in a rendered target without a FlexiWidgetWrapper context. This is likely a Flexiboards bug.");
        }
    }

    setContext(contextKey, widget);
    return {
        widget,
        onpointerdown: (event: PointerEvent) => widget.onpointerdown(event)
    };
}

export function flexigrab() {
    const widget = getFlexiwidgetCtx();
    if(!widget) {
        throw new Error("A FlexiGrab was instantiated outside of a FlexiWidget context. Ensure that flexigrab() (or <FlexiGrab>) is called within a <FlexiWidget> component.");
    }

    const { onpointerdown } = widget.addGrabber();

    onDestroy(() => {
        widget.removeGrabber();
    });

    return { widget, onpointerdown };
}

export function getFlexiwidgetCtx() {
    return getContext<FlexiWidget | undefined>(contextKey);
}