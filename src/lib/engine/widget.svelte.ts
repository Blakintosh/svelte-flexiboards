import { getContext, setContext, type Component, type Snippet } from "svelte";
import { getFlexitargetCtx, type FlexiTarget } from "./target.svelte.js";
import type { GrabbedWidget } from "./types.js";
import { getFlexiwidgetwrapperCtx } from "./utils.svelte.js";

class FlexiWidget {
    /**
     * Stores the underlying state of the widget.
     */
    #state: FlexiWidgetState = $state({
        grabbed: null,
        resizable: false,
        draggable: false,
        width: 1,
        height: 1,
        snippet: null,
        component: null,
        className: null,
        x: 0,
        y: 0
    });

    isShadow: boolean = $state(false);

    /**
     * The target that this widget belongs to.
     */
    target: FlexiTarget;

    style: string = $derived.by(() => {
        if(!this.draggable) {
            return '';
        }

        if(!this.grabbed) {
            return `user-select: none; cursor: grab; grid-column: ${this.x + 1} / span ${this.width}; grid-row: ${this.y + 1} / span ${this.height};`;
        }

        return `pointer-events: none; user-select: none; cursor: grabbing; position: absolute; top: ${this.grabbed.positionWatcher.position.y - this.grabbed.offsetY}px; left: ${this.grabbed.positionWatcher.position.x - this.grabbed.offsetX}px; height: ${this.grabbed.capturedHeight}px; width: ${this.grabbed.capturedWidth}px;`;
    })

    constructor(target: FlexiTarget, config: BoardWidgetConfiguration, snippet: FlexiWidgetChildrenSnippet | undefined, className: string | undefined, isShadow: boolean = false) {
        this.target = target;

        this.width = config.width ?? 1;
        this.height = config.height ?? 1;

        this.snippet = snippet ?? null;

        this.resizable = config.resizable ?? false;
        this.draggable = config.draggable ?? false;

        this.component = config.component ?? null;
        this.className = className ?? null;

        this.isShadow = isShadow;

        // Allows the event handlers to be called without binding to the widget instance.
        this.onmousedown = this.onmousedown.bind(this);
    }

    onmousedown(event: MouseEvent) {
        if(!this.draggable || !event.target) return;

        const rect = (event.target as HTMLElement).getBoundingClientRect();

        // Get the offset of the cursor relative to the widget's bounds.
        const xOffset = event.clientX - rect.left;
        const yOffset = event.clientY - rect.top;

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

    // State-related getters and setters

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
        return this.#state.draggable;
    }

    set draggable(value: boolean) {
        this.#state.draggable = value;
    }

    /**
     * Whether the widget is resizable.
     */
    get resizable() {
        return this.#state.resizable;
    }

    set resizable(value: boolean) {
        this.#state.resizable = value;
    }

    /**
     * The width in units of the widget.
     */
    get width() {
        return this.#state.width;
    }

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
        return this.#state.component;
    }

    set component(value: Component | null) {
        this.#state.component = value;
    }

    /**
     * The snippet that is rendered by this widget.
     */
    get snippet() {
        return this.#state.snippet;
    }

    set snippet(value: FlexiWidgetChildrenSnippet | null) {
        this.#state.snippet = value;
    }

    /**
     * The class name that is applied to this widget.
     */
    get className() {
        return this.#state.className;
    }

    set className(value: string | null) {
        this.#state.className = value;
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

/**
 * A proxy container that stores the state of a FlexiWidget.
 */
type FlexiWidgetState = {
    /**
     * When the widget is being grabbed, this contains information that includes its position, size and offset.
     * When this is null, the widget is not being grabbed.
     */
    grabbed: GrabbedWidget | null;

    /**
     * Whether the widget is resizable.
     */
    resizable: boolean;

    /**
     * Whether the widget is draggable.
     */
    draggable: boolean;

    /**
     * The width in units of the widget.
     */
    width: number;

    /**
     * The height in units of the widget.
     */
    height: number;

    /**
     * The component that is rendered by this widget. Snippet mode cannot be used in conjunction with this property.
     */
    component: Component | null;

    /**
     * The snippet that is rendered by this widget. Component mode cannot be used in conjunction with this property.
     */
    snippet: FlexiWidgetChildrenSnippet | null;

    /**
     * The class name that is applied to this widget.
     */
    className: string | null;

    /**
     * The column (x-coordinate) of the widget.
     */
    x: number;

    /**
     * The row (y-coordinate) of the widget.
     */
    y: number;
}

type BoardWidgetConfiguration = {
    width?: number;
    height?: number;
    x?: number;
    y?: number;

    /**
     * The component that is rendered by this item.
     */
    component?: Component;

    /**
     * The component that is rendered by this item when it is being dragged. If not provided, the {@link component} property will be used.
     */
    ghostComponent?: Component;

    /**
     * Whether the item is resizable.
     */
    resizable?: boolean;

    /**
     * Whether the item is draggable.
     */
    draggable?: boolean;
}

type FlexiWidgetChildrenSnippet = Snippet<[{ widget: FlexiWidget }]>;

const contextKey = Symbol('flexiwidget');

function flexiwidget(config: BoardWidgetConfiguration, snippet: FlexiWidgetChildrenSnippet | undefined, className: string | undefined) {
    const target = getFlexitargetCtx();

    if(!target) {
        throw new Error("A FlexiWidget was instantiated outside of a FlexiTarget context. Ensure that flexiwidget() (or <FlexiWidget>) is called within a <FlexiTarget> component.");
    }

    let widget: FlexiWidget | undefined;
    if(!target.rendered) {
        widget = target.createWidget(config, snippet, className);
    } else {
        widget = getFlexiwidgetwrapperCtx();
        if(!widget) {
            throw new Error("A FlexiWidget was instantiated in a rendered target without a FlexiWidgetWrapper context. This is likely a Flexiboards bug.");
        }
    }

    setContext(contextKey, widget);
    return {
        widget,
        onmousedown: (event: MouseEvent) => widget.onmousedown(event)
    };
}

function getFlexiwidgetCtx() {
    return getContext<FlexiWidget | undefined>(contextKey);
}

export {
    FlexiWidget,
    type BoardWidgetConfiguration,
    type FlexiWidgetChildrenSnippet,
    flexiwidget,
    getFlexiwidgetCtx
}