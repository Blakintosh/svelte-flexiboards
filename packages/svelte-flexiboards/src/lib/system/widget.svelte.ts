import { getContext, onDestroy, setContext, type Component, type Snippet } from "svelte";
import { getFlexitargetCtx, type FlexiTarget, type FlexiTargetConfiguration } from "./target.svelte.js";
import type { WidgetAction, SvelteClassValue, WidgetGrabAction, WidgetResizeAction, WidgetResizability } from "./types.js";
import { getFlexiwidgetwrapperCtx } from "./utils.svelte.js";

export type FlexiWidgetChildrenSnippet = Snippet<[{ widget: FlexiWidget, Component?: Component }]>;

export type FlexiWidgetClassFunction = (widget: FlexiWidget) => SvelteClassValue;
export type FlexiWidgetClasses = SvelteClassValue | FlexiWidgetClassFunction;

export type FlexiWidgetDefaults<T extends Record<string, any> = {}> = {
    draggable?: boolean;
    resizability?: WidgetResizability;
    width?: number;
    height?: number;
    snippet?: FlexiWidgetChildrenSnippet;
    component?: Component<T>;
    componentProps?: T;
    className?: FlexiWidgetClasses;
};

export type FlexiWidgetConfiguration<T extends Record<string, any> = {}> = FlexiWidgetDefaults<T> & {
    name?: string;
    x?: number;
    y?: number;
    metadata?: Record<string, any>;
};

type FlexiWidgetState = {
    currentAction: WidgetAction | null;
    width: number;
    height: number;
    x: number;
    y: number;
}

type FlexiWidgetDerivedConfiguration = {
    /**
     * The name of the widget, which can be used to identify it in exported layouts.
     */
    name?: string;

    /**
     * The component that is rendered by this item. This is optional if a snippet is provided.
     */
    component?: Component;

    /**
     * The props applied to the component rendered, if it has one.
     */
    componentProps?: Record<string, any>;

    /**
     * The snippet that is rendered by this widget. This is optional when a component is provided. If used alongside component, then this snippet is passed the component and should render it.
     */
    snippet?: FlexiWidgetChildrenSnippet;

    /**
     * The resizability of the widget.
     */
    resizability: WidgetResizability;

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
    target: FlexiTarget = $state() as FlexiTarget;

    #providerWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.providerWidgetDefaults);
    #targetWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.config.widgetDefaults);
    #rawConfig: FlexiWidgetConfiguration = $state() as FlexiWidgetConfiguration;

    ref?: HTMLElement = $state(undefined);

    /**
     * The reactive configuration of the widget. When these properties are changed, either due to a change in the widget's configuration,
     * or a change in the target's, or the board's, they will be updated to reflect the new values.
     */
    #config: FlexiWidgetDerivedConfiguration = $derived({
        component: this.#rawConfig.component ?? this.#targetWidgetDefaults?.component ?? this.#providerWidgetDefaults?.component,
        componentProps: this.#rawConfig.componentProps ?? this.#targetWidgetDefaults?.componentProps ?? this.#providerWidgetDefaults?.componentProps,
        snippet: this.#rawConfig.snippet ?? this.#targetWidgetDefaults?.snippet ?? this.#providerWidgetDefaults?.snippet,
        resizability: this.#rawConfig.resizability ?? this.#targetWidgetDefaults?.resizability ?? this.#providerWidgetDefaults?.resizability ?? "none",
        draggable: this.#rawConfig.draggable ?? this.#targetWidgetDefaults?.draggable ?? this.#providerWidgetDefaults?.draggable ?? true,
        className: this.#rawConfig.className ?? this.#targetWidgetDefaults?.className ?? this.#providerWidgetDefaults?.className,
    });

    /**
     * Stores the underlying state of the widget. This differs to the derived config above, because it contains configuration items that
     * are only written to once when the widget is created. Properties stored in here do not react to changes in the config.
     */
    #state: FlexiWidgetState = $state({
        currentAction: null,
        width: 1,
        height: 1,
        x: 0,
        y: 0
    });

    isShadow: boolean = $state(false);
    isGrabbed: boolean = $derived(this.currentAction?.action == "grab");
    isResizing: boolean = $derived(this.currentAction?.action == "resize");

    grabbers: number = $state(0);
    resizers: number = $state(0);

    style: string = $derived.by(() => {
        const currentAction = this.currentAction;

        if(!currentAction) {
            return `grid-column: ${this.x + 1} / span ${this.width}; grid-row: ${this.y + 1} / span ${this.height};` +
                this.#getCursorStyle();
        }

        // Grab action
        if(currentAction.action == "grab") {
            return this.#getGrabbedWidgetStyle(currentAction);
        }

        // Resize action
        return this.#getResizingWidgetStyle(currentAction);
    });

    #getCursorStyle() {
        if(!this.draggable) {
            return '';
        }

        if(this.isGrabbed) {
            return 'pointer-events: none; user-select: none; cursor: grabbing;';
        }

        if(this.isResizing) {
            return 'pointer-events: none; user-select: none; cursor: nwse-resize;';
        }

        if(this.grabbers == 0) {
            return 'user-select: none; cursor: grab;';
        }

        return 'user-select: none;';
    }

    #getGrabbedWidgetStyle(action: WidgetGrabAction) {
        const locationOffsetX = action.positionWatcher.position.x - action.offsetX;
        const locationOffsetY = action.positionWatcher.position.y - action.offsetY;

        // Fixed when it's a grabbed widget.
        const height = action.capturedHeightPx;
        const width = action.capturedWidthPx;

        return `pointer-events: none; user-select: none; cursor: grabbing; position: absolute; top: ${locationOffsetY}px; left: ${locationOffsetX}px; height: ${height}px; width: ${width}px;`;
    }

    #getResizingWidgetStyle(action: WidgetResizeAction) {
        const unitSizeY = action.heightPx / action.initialHeightUnits;
        const unitSizeX = action.widthPx / action.initialWidthUnits;

        // TODO: need to compute the new top and left relative to the provider.
        const top = action.top;
        const left = action.left;

        // Calculate new dimensions based on resizability
        let height = action.heightPx;
        let width = action.widthPx;

        switch (this.resizability) {
            case 'horizontal':
                width = Math.max(action.widthPx + (action.positionWatcher.position.x - action.offsetX), unitSizeX);
                break;
            case 'vertical': 
                height = Math.max(action.heightPx + (action.positionWatcher.position.y - action.offsetY), unitSizeY);
                break;
            case 'both':
                height = Math.max(action.heightPx + (action.positionWatcher.position.y - action.offsetY), unitSizeY);
                width = Math.max(action.widthPx + (action.positionWatcher.position.x - action.offsetX), unitSizeX);
                break;
        }

        return `pointer-events: none; user-select: none; cursor: nwse-resize; position: absolute; top: ${top}px; left: ${left}px; height: ${height}px; width: ${width}px;`;
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
        this.onresizerpointerdown = this.onresizerpointerdown.bind(this);
    }

    onpointerdown(event: PointerEvent) {
        if(!this.draggable || !event.target || this.grabbers) {
            return;
        };

        this.grabWidget(event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    ongrabberpointerdown(event: PointerEvent) {
        if(!this.draggable || !event.target) {
            return;
        };

        this.grabWidget(event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    onresizerpointerdown(event: PointerEvent) {
        if(this.resizability == "none" || !event.target) {
            return;
        };

        this.startResizeWidget(event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't properly maintain correct focuses.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    grabWidget(clientX: number, clientY: number) {
        if(!this.ref) {
            throw new Error("A FlexiWidget was instantiated without a bound reference element.");
        }

        const rect = this.ref.getBoundingClientRect();

        // Get the offset of the cursor relative to the widget's bounds.
        const xOffset = clientX - rect.left;
        const yOffset = clientY - rect.top;

        // Propagate an event up to the parent target, indicating that the widget has been grabbed.
        this.currentAction = this.target.onwidgetgrabbed({
            widget: this,
            target: this.target,
            xOffset,
            yOffset,
            // Capture the current size of the widget so that we can fix this once it's moving.
            capturedHeight: rect.height,
            capturedWidth: rect.width
        });
    }
    
    startResizeWidget(clientX: number, clientY: number) {
		console.log("go for wefwefewfwe")
        if(!this.ref) {
            throw new Error("A FlexiWidget was instantiated without a bound reference element.");
        }

        const rect = this.ref.getBoundingClientRect();

        // Propagate an event up to the parent target, indicating that the widget has started resizing.
        this.currentAction = this.target.onwidgetstartresize({
            widget: this,
            target: this.target,
            xOffset: clientX,
            yOffset: clientY,
            left: rect.left,
            top: rect.top,
            heightPx: rect.height,
            widthPx: rect.width
        });
        console.log("currentAction", this.currentAction);
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

    addResizer() {
        this.resizers++;

        return {
            onpointerdown: this.onresizerpointerdown
        }
    }

    removeResizer() {
        this.resizers--;
    }

    // Getters and setters

    /**
     * When the widget is being grabbed, this contains information that includes its position, size and offset.
     * When this is null, the widget is not being grabbed.
     */
    get currentAction() {
        return this.#state.currentAction;
    }

    set currentAction(value: WidgetAction | null) {
        this.#state.currentAction = value;
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
     * The resizability of the widget.
     */
    get resizability() {
        return this.#config.resizability;
    }

    set resizability(value: WidgetResizability) {
        this.#rawConfig.resizability = value;
    }

    /**
     * Whether the widget is resizable.
     */
    get resizable() {
        return this.resizability !== 'none';
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

    /**
     * The props applied to the component rendered, if it has one.
     */
    get componentProps() {
        return this.#config.componentProps;
    }

    set componentProps(value: Record<string, any> | undefined) {
        this.#rawConfig.componentProps = value;
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

export function flexiresize() {
    const widget = getFlexiwidgetCtx();
    if(!widget) {
        throw new Error("A FlexiResize was instantiated outside of a FlexiWidget context. Ensure that flexiresize() (or <FlexiResize>) is called within a <FlexiWidget> component.");
    }

    const { onpointerdown } = widget.addResizer();

    onDestroy(() => {
        widget.removeResizer();
    });

    return { widget, onpointerdown };
}

export function getFlexiwidgetCtx() {
    return getContext<FlexiWidget | undefined>(contextKey);
}