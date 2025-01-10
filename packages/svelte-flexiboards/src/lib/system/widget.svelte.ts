import { getContext, onDestroy, setContext, type Component, type Snippet } from "svelte";
import { getInternalFlexitargetCtx, type InternalFlexiTargetController, type FlexiTargetConfiguration, type FlexiTargetController } from "./target.svelte.js";
import type { WidgetAction, SvelteClassValue, WidgetGrabAction, WidgetResizeAction, WidgetResizability } from "./types.js";
import type { FlexiAddController } from "./manage.svelte.js";

export type FlexiWidgetChildrenSnippetParameters = { widget: FlexiWidgetController, component?: Component, componentProps?: Record<string, any> };
export type FlexiWidgetChildrenSnippet = Snippet<[FlexiWidgetChildrenSnippetParameters]>;

export type FlexiWidgetClassFunction = (widget: FlexiWidgetController) => SvelteClassValue;
export type FlexiWidgetClasses = SvelteClassValue | FlexiWidgetClassFunction;

export type FlexiWidgetDefaults = {
    /**
     * Whether the widget is draggable.
     */
    draggable?: boolean;

    /**
     * The resizability of the widget.
     */
    resizability?: WidgetResizability;

    /**
     * The width of the widget in units.
     */
    width?: number;

    /**
     * The height of the widget in units.
     */
    height?: number;

    /**
     * The snippet that is rendered by this widget.
     */
    snippet?: FlexiWidgetChildrenSnippet;

    /**
     * The component that is rendered by this widget.
     */
    component?: Component<any, any, any>;

    /**
     * The props applied to the component rendered, if it has one.
     */
    componentProps?: Record<string, any>;

    /**
     * The class names to apply to this widget.
     */
    className?: FlexiWidgetClasses;
};

export type FlexiWidgetConfiguration = FlexiWidgetDefaults & {
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

    /**
     * The metadata associated with this widget, if any.
     */
    metadata?: Record<string, any>;
};

type FlexiWidgetUnderAdderConstructor = {
    type: "adder";
    adder: FlexiAddController;
    widthPx: number;
    heightPx: number;
}

type FlexiWidgetUnderTargetConstructor = {
    type: "target";
    target: InternalFlexiTargetController;
    isShadow?: boolean;
};

type FlexiWidgetConstructor = (FlexiWidgetUnderAdderConstructor | FlexiWidgetUnderTargetConstructor) & {
    config: FlexiWidgetConfiguration;
};

export class FlexiWidgetController implements FlexiWidgetController {
    /**
     * The target this widget is under, if any.
     */
    target?: FlexiTargetController = $state(undefined);

    /**
     * The adder this widget is currently being created under, if any.
     */
    adder?: FlexiAddController = $state(undefined);

    #providerWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.providerWidgetDefaults);
    #targetWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.config.widgetDefaults);
    #rawConfig: FlexiWidgetConfiguration = $state() as FlexiWidgetConfiguration;

    /**
     * The DOM element bound to this widget.
     */
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
        metadata: this.#rawConfig.metadata
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

    /**
     * Whether this widget is a shadow dropzone widget.
     */
    isShadow: boolean = $state(false);

    /**
     * Whether this widget is grabbed.
     */
    isGrabbed: boolean = $derived(this.currentAction?.action == "grab");

    /**
     * Whether this widget is being resized.
     */
    isResizing: boolean = $derived(this.currentAction?.action == "resize");

    #grabbers: number = $state(0);
    #resizers: number = $state(0);

    /**
     * The styling to apply to the widget.
     */
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

        if(this.#grabbers == 0) {
            return 'user-select: none; cursor: grab; touch-action: none;';
        }

        return '';
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

    // Constructor for widget creation directly under a FlexiTarget
    constructor(ctor: FlexiWidgetConstructor) {
        this.#rawConfig = ctor.config;

        // Populate the state proxy with the configuration values.
        this.#state.width = ctor.config.width ?? 1;
        this.#state.height = ctor.config.height ?? 1;

        if(ctor.type == "target") {
            this.target = ctor.target;
            this.isShadow = ctor.isShadow ?? false;
        } else if(ctor.type == "adder") {
            this.adder = ctor.adder;

            // Start the widget drag in event
            this.currentAction = this.adder.onstartwidgetdragin({
                widget: this,
                xOffset: 0,
                yOffset: 0,
                // Pass through the base size of the widget.
                capturedHeight: ctor.heightPx,
                capturedWidth: ctor.widthPx
            });
        }

        // Allows the event handlers to be called without binding to the widget instance.
        this.onpointerdown = this.onpointerdown.bind(this);
        this.ongrabberpointerdown = this.ongrabberpointerdown.bind(this);
        this.onresizerpointerdown = this.onresizerpointerdown.bind(this);
    }

    /**
     * Event handler for when the widget receives a pointerdown event.
     * @param event The event object.
     */
    onpointerdown(event: PointerEvent) {
        if(!this.draggable || !event.target || this.#grabbers) {
            return;
        };

        this.#grabWidget(event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    /**
     * Event handler for when one of the widget's grabbers receives a pointerdown event.
     * @param event The event object.
     */
    ongrabberpointerdown(event: PointerEvent) {
        if(!this.draggable || !event.target) {
            return;
        };

        this.#grabWidget(event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    /**
     * Event handler for when one of the widget's resizers receives a pointerdown event.
     * @param event The event object.
     */
    onresizerpointerdown(event: PointerEvent) {
        if(this.resizability == "none" || !event.target) {
            return;
        };

        this.#startResizeWidget(event.clientX, event.clientY);
        // Don't implicitly keep the pointer capture, as then mobile can't properly maintain correct focuses.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    #grabWidget(clientX: number, clientY: number) {
        if(!this.ref) {
            throw new Error("A FlexiWidget was instantiated without a bound reference element.");
        }

        // If the widget is new, then this event shouldn't fire yet.
        if(!this.target) {
            return;
        }

        const rect = this.ref.getBoundingClientRect();

        // Get the offset of the cursor relative to the widget's bounds.
        const xOffset = clientX - rect.left;
        const yOffset = clientY - rect.top;

        // Propagate an event up to the parent target, indicating that the widget has been grabbed.
        this.currentAction = this.target.grabWidget({
            widget: this,
            xOffset,
            yOffset,
            // Capture the current size of the widget so that we can fix this once it's moving.
            capturedHeight: rect.height,
            capturedWidth: rect.width
        });
    }
    
    #startResizeWidget(clientX: number, clientY: number) {
        if(!this.ref) {
            throw new Error("A FlexiWidget was instantiated without a bound reference element.");
        }

        // If the widget is new, then this event shouldn't fire yet.
        if(!this.target) {
            return;
        }

        const rect = this.ref.getBoundingClientRect();

        // Propagate an event up to the parent target, indicating that the widget has started resizing.
        this.currentAction = this.target.startResizeWidget({
            widget: this,
            xOffset: clientX,
            yOffset: clientY,
            left: rect.left,
            top: rect.top,
            heightPx: rect.height,
            widthPx: rect.width
        });
    }

    /**
     * Sets the bounds of the widget.
     * @remarks This is not intended for use externally.
     * @param x The x-coordinate of the widget.
     * @param y The y-coordinate of the widget.
     * @param width The width of the widget.
     * @param height The height of the widget.
     */
    setBounds(x: number, y: number, width: number, height: number) {
        this.#state.x = x;
        this.#state.y = y;
        this.#state.width = width;
        this.#state.height = height;
    }

    /**
     * Registers a grabber to the widget and returns an object with an `onpointerdown` event handler.
     * @returns An object with an `onpointerdown` event handler.
     */
    addGrabber() {
        this.#grabbers++;

        return {
            onpointerdown: this.ongrabberpointerdown
        }
    }

    /**
     * Unregisters a grabber from the widget.
     */
    removeGrabber() {
        this.#grabbers--;
    }

    /**
     * Registers a resizer to the widget and returns an object with an `onpointerdown` event handler.
     * @returns An object with an `onpointerdown` event handler.
     */
    addResizer() {
        this.#resizers++;

        return {
            onpointerdown: this.onresizerpointerdown
        }
    }

    /**
     * Unregisters a resizer from the widget.
     */
    removeResizer() {
        this.#resizers--;
    }

    /**
     * Deletes this widget from its target and board.
     */
    delete() {
        // If the widget hasn't been assigned to a target yet, then we just need to take it off the adder that
        // created it.
        if(this.adder) {
            this.adder.onstopwidgetdragin();
            return;
        }

        // Otherwise it should have a target.
        if(!this.target) {
            throw new Error("A FlexiWidget was deleted without a bound target. This is likely a Flexiboards bug.");
        }

        this.target.deleteWidget(this);
        this.currentAction = null;
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

    /**
     * The height in units of the widget.
     */
    get height() {
        return this.#state.height;
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
     * The props applied to the component rendered, if it has one.
     */
    get componentProps() {
        return this.#config.componentProps;
    }

    set componentProps(value: Record<string, any> | undefined) {
        this.#rawConfig.componentProps = value;
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
     * The metadata associated with this widget, if any.
     */
    get metadata() {
        return this.#config.metadata;
    }

    set metadata(value: Record<string, any> | undefined) {
        this.#rawConfig.metadata = value;
    }
}

const contextKey = Symbol('flexiwidget');

export function flexiwidget(config: FlexiWidgetConfiguration) {
    const target = getInternalFlexitargetCtx();

    if(!target) {
        throw new Error("A FlexiWidget was instantiated outside of a FlexiTarget context. Ensure that flexiwidget() (or <FlexiWidget>) is called within a <FlexiTarget> component.");
    }

    const widget = target.createWidget(config);

    if(!widget) {
        throw new Error("Failed to create widget. Check that the widget's x and y coordinates do not lead to an unresolvable collision.");
    }

    setContext(contextKey, widget);
    return {
        widget
    };
}

export function renderedflexiwidget(widget: FlexiWidgetController) {
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
    const widget = getContext<FlexiWidgetController>(contextKey);

    if(!widget) {
        throw new Error("Attempt to get FlexiWidget context outside of a <FlexiWidget> component. Ensure that getFlexiwidgetCtx() is called within a <FlexiWidget> component.");
    }

    return widget;
}