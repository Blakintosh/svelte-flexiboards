import { getContext, setContext } from "svelte";
import { getFlexiboardCtx, type FlexiBoard } from "./provider.svelte.js";
import { FlexiWidget, type FlexiWidgetConfiguration, type FlexiWidgetDefaults } from "./widget.svelte.js";
import type { GrabbedWidgetMouseEvent, MouseGridCellMoveEvent, Position, ProxiedValue, WidgetAction, WidgetDroppedEvent, WidgetGrabAction, WidgetGrabbedEvent, WidgetStartResizeEvent } from "./types.js";
import { SvelteSet } from "svelte/reactivity";
import { FlowFlexiGrid, FlexiGrid, FreeFormFlexiGrid, type FlowTargetLayout, type FreeFormTargetLayout } from "./grid.svelte.js";
import type { FlexiTargetProps } from "$lib/components/flexi-target.svelte";

type TargetSizingFn = ({ target, grid }: { target: FlexiTarget, grid: FlexiGrid }) => string;
export type TargetSizing = TargetSizingFn | string;

export type FlexiTargetDefaults = {
    capacity?: number | null;
    minColumns?: number | null;
    minRows?: number | null;
    rowSizing?: TargetSizing;
    columnSizing?: TargetSizing;

    layout?: TargetLayout;
};
export type FlexiTargetPartialConfiguration = FlexiTargetDefaults & {
    widgetDefaults?: FlexiWidgetDefaults;
};

export type FlexiTargetConfiguration = Required<FlexiTargetDefaults> & {
    widgetDefaults?: FlexiWidgetDefaults;
};

export type TargetLayout = FlowTargetLayout | FreeFormTargetLayout;

class FlexiTarget {
    widgets: SvelteSet<FlexiWidget> = $state(new SvelteSet());

    provider: FlexiBoard = $state() as FlexiBoard;

    #providerTargetDefaults?: FlexiTargetDefaults = $derived(this.provider?.config?.targetDefaults);
    providerWidgetDefaults?: FlexiWidgetDefaults = $derived(this.provider?.config?.widgetDefaults);

    /**
     * Stores the underlying state of the target.
     */
    #state: FlexiTargetState = $state({ 
        hovered: false,
        actionWidget: null,
        prepared: false
    });

    #dropzoneWidget: ProxiedValue<FlexiWidget | null> = $state({
        value: null
    });

    #mouseCellPosition: Position = $state({
        x: 0,
        y: 0
    });

    key: string;


    #grid: FlexiGrid | null = null;

    #preGrabSnapshot: unknown | null = null;
    #gridSnapshot: unknown | null = null;

    #targetConfig?: FlexiTargetPartialConfiguration = $state(undefined);

    config: FlexiTargetConfiguration = $derived({
        capacity: this.#targetConfig?.capacity ?? this.#providerTargetDefaults?.capacity ?? null,
        minColumns: this.#targetConfig?.minColumns ?? this.#providerTargetDefaults?.minColumns ?? null,
        minRows: this.#targetConfig?.minRows ?? this.#providerTargetDefaults?.minRows ?? null,
        layout: this.#targetConfig?.layout ?? this.#providerTargetDefaults?.layout ?? {
            type: "flow",
            flowAxis: "row",
            placementStrategy: "append"
        },
        rowSizing: this.#targetConfig?.rowSizing ?? this.#providerTargetDefaults?.rowSizing ?? "minmax(1rem, auto)",
        columnSizing: this.#targetConfig?.columnSizing ?? this.#providerTargetDefaults?.columnSizing ?? "minmax(0, 1fr)",
        widgetDefaults: this.#targetConfig?.widgetDefaults
    });
    
    constructor(provider: FlexiBoard, config?: FlexiTargetConfiguration, key?: string) {
        this.provider = provider;
        // If we weren't provided a key, the provider will generate one for us.
        this.key = provider.addTarget(this, key);

        this.#targetConfig = config;
    }

    #tryAddWidget(widget: FlexiWidget, x?: number, y?: number, width?: number, height?: number): boolean {
        const added = this.grid.tryPlaceWidget(widget, x, y, width, height);
        
        if(added) {
            this.widgets.add(widget);
        }
        return added;
    }

    createGrid() {
        if(this.#grid) {
            console.warn("A grid already exists but is being replaced. If this is due to a hot reload, this is no cause for alarm.");
        }

        const layout = this.config.layout;
        switch(layout.type) {
            case "free":
                this.#grid = new FreeFormFlexiGrid(this, this.config, layout);
                break;
            case "flow":
                this.#grid = new FlowFlexiGrid(this, this.config, layout);
                break;
        }
        return this.#grid;
    }

    /**
     * Creates a new widget under this target.
     * @param config The configuration of the widget to create.
     * @returns The newly created widget.
     */
    createWidget(config: FlexiWidgetConfiguration) {
        const [x, y, width, height] = [config.x, config.y, config.width, config.height];
        const widget = new FlexiWidget({
            type: "target",
            target: this,
            config
        });
        
        // TODO: It's not appropriate to throw a big error at runtime
        if(!this.#tryAddWidget(widget, x, y, width, height)) {
            throw new Error("Failed to add widget to target. Check that the widget's x and y coordinates do not lead to an unresolvable collision.");
        }

        return widget;
    }

    /**
     * Deletes the given widget from this target, if it exists.
     * @returns Whether the widget was deleted.
     */
    deleteWidget(widget: FlexiWidget): boolean {
        const deleted = this.widgets.delete(widget);
        this.grid.removeWidget(widget);

        return deleted;
    }

    /**
     * Imports a layout of widgets into this target, replacing any existing widgets.
     * @param layout The layout to import.
     */
    importLayout(layout: FlexiWidgetConfiguration[]) {
        this.widgets.clear();
        this.grid.clear();

        for(const config of layout) {
            this.createWidget(config);
        }
    }

    /**
     * Exports the current layout of widgets from this target.
     * @returns The layout of widgets.
     */
    exportLayout(): FlexiWidgetConfiguration[] {
        const result: FlexiWidgetConfiguration[] = [];

        // Likely much more information than needed, but we've got it.
        for(const widget of this.widgets) {
            result.push({
                component: widget.component,
                componentProps: widget.componentProps,
                snippet: widget.snippet,
                width: widget.width,
                height: widget.height,
                x: widget.x,
                y: widget.y,
                draggable: widget.draggable,
                resizability: widget.resizability,
                className: widget.className,
                metadata: widget.metadata
            });
        }

        return result;
    }

    #createShadow(of: FlexiWidget) {
        const shadow = new FlexiWidget({
            type: "target",
            target: this, 
            config: {
                width: of.width,
                height: of.height,
                component: of.component,
                draggable: of.draggable,
                resizability: of.resizability,
                snippet: of.snippet,
                className: of.className,
                componentProps: of.componentProps
            },
            isShadow: true
        });
        this.widgets.add(shadow);

        return shadow;
    }

    // Events
    onpointerenter() {
        this.hovered = true;

        this.provider.onpointerentertarget({
            target: this
        });
    }

    onpointerleave() {
        this.hovered = false;

        this.provider.onpointerleavetarget({
            target: this
        });
    }

    onwidgetgrabbed(event: WidgetGrabbedEvent) {
        // Take a snapshot of the grid before the widget is removed, so if the widget is not successfully placed
        // we can restore the grid to its original state.
        this.#preGrabSnapshot = this.grid.takeSnapshot();

        // Remove the widget from the grid as it's now in a floating state.
        this.grid.removeWidget(event.widget);

        return this.provider.onwidgetgrabbed(event);
    }

    restorePreGrabSnapshot() {
        if(!this.#preGrabSnapshot) {
            return;
        }

        this.grid.restoreFromSnapshot(this.#preGrabSnapshot!);
        this.forgetPreGrabSnapshot();
    }

    forgetPreGrabSnapshot() {
        this.#preGrabSnapshot = null;
    }

    onwidgetstartresize(event: WidgetStartResizeEvent) {
        // Remove the widget as it's now in a pseudo-floating state.
        this.grid.removeWidget(event.widget);

        const result = this.provider.onwidgetstartresize(event);

        if(result) {
            this.actionWidget = {
                action: "resize",
                widget: event.widget
            };

            this.#createDropzoneWidget();
        }

        return result;
    }

    onwidgetdropped(event: WidgetDroppedEvent) {

        const actionWidget = this.actionWidget;
        if(!actionWidget) {
            return;
        }

        const [x, y, width, height] = this.#getDropzoneLocation(actionWidget);
        this.actionWidget = null;
        this.#removeDropzoneWidget();

        // Try to formally place the widget in the grid, which will also serve as a final check that
        // the drop is possible.
        const grid = this.grid;


        const canPlace = grid.tryPlaceWidget(event.widget, x, y, width, height);

        // Don't go ahead with the drop, the placement is not possible.
        if(!canPlace) {
            event.preventDefault();
        }
    }

    onmousegridcellmove(event: MouseGridCellMoveEvent) {
        // TODO: it would be helpful if we could establish when the position has not changed AND the dropzone widget is there, in which case we wouldn't
        // need to update it in the grid (which is expensive).
        this.#updateMouseCellPosition(event.cellX, event.cellY);
        this.#updateDropzoneWidget();
    }

    ongrabbedwidgetover(event: GrabbedWidgetMouseEvent) {
        this.actionWidget = {
            action: "grab",
            widget: event.widget
        };

        this.#createDropzoneWidget();
    }

    ongrabbedwidgetleave() {
        this.actionWidget = null;
        this.#removeDropzoneWidget();
    }

    oninitialloadcomplete() {
        this.prepared = true;
    }

    #updateMouseCellPosition(x: number, y: number) {
        this.#mouseCellPosition.x = x;
        this.#mouseCellPosition.y = y;
    }

    #createDropzoneWidget() {
        if(this.dropzoneWidget || !this.actionWidget) {
            return;
        }
        const grid = this.grid;

        // Take a snapshot of the grid so we can restore its state if the hover stops.
        this.#gridSnapshot = grid.takeSnapshot();

        const dropzoneWidget = this.#createShadow(this.actionWidget.widget);
        this.dropzoneWidget = dropzoneWidget;

        let [x, y, width, height] = this.#getDropzoneLocation(this.actionWidget);

        grid.tryPlaceWidget(this.dropzoneWidget, x, y, width, height);
    }

    #updateDropzoneWidget() {
        const dropzoneWidget = this.dropzoneWidget;
        const actionWidget = this.actionWidget;

        if(!dropzoneWidget || !actionWidget) {
            return;
        }

        let [x, y, width, height] = this.#getDropzoneLocation(actionWidget);

        const grid = this.grid;

        // No change, no need to update.
        if(x === dropzoneWidget.x && y === dropzoneWidget.y && width === dropzoneWidget.width && height === dropzoneWidget.height) {
            return;
        }

        grid.removeWidget(dropzoneWidget);
        grid.restoreFromSnapshot(this.#gridSnapshot!);

        grid.tryPlaceWidget(dropzoneWidget, x, y, width, height);
    }

    #getDropzoneLocation(actionWidget: FlexiTargetActionWidget) {
        const mouseCellPosition = this.#mouseCellPosition;

        switch(actionWidget.action) {
            case "grab":
                return this.#getGrabbedDropzoneLocation(actionWidget.widget, mouseCellPosition);
            case "resize":
                return this.#getResizingDropzoneLocation(actionWidget.widget, mouseCellPosition);
        }
    }

    #getGrabbedDropzoneLocation(grabbedWidget: FlexiWidget, mouseCellPosition: Position): [x: number, y: number, width: number, height: number] {
        return [mouseCellPosition.x, mouseCellPosition.y, grabbedWidget.width, grabbedWidget.height];
    }

    #getResizingDropzoneLocation(resizingWidget: FlexiWidget, mouseCellPosition: Position): [x: number, y: number, width: number, height: number] {
        const { width, height } = this.#getNewWidgetHeightAndWidth(resizingWidget, mouseCellPosition);
        
        return [resizingWidget.x, resizingWidget.y, width, height];
    }

    #getNewWidgetHeightAndWidth(widget: FlexiWidget, mouseCellPosition: Position) {
        const grid = this.grid;

        // TODO: do not allow flow axis resizing in flow layouts.
        const newWidth = mouseCellPosition.x - widget.x;
        const newHeight = mouseCellPosition.y - widget.y;

        switch(widget.resizability) {
            case "horizontal":
                return { width: newWidth, height: widget.height };
            case "vertical":
                return { width: widget.width, height: newHeight };
            case "both":
                return { width: newWidth, height: newHeight };
        }

        return { width: widget.width, height: widget.height };
    }

    #removeDropzoneWidget() {
        if(!this.dropzoneWidget) {
            return;
        }

        const grid = this.grid;

        grid.removeWidget(this.dropzoneWidget);
        this.widgets.delete(this.dropzoneWidget);

        grid.restoreFromSnapshot(this.#gridSnapshot!);
        this.#gridSnapshot = null;

        this.dropzoneWidget = null;
    }

    // State-related getters and setters

    /**
     * Whether the target is currently being hovered over by the mouse.
     */
    get hovered() {
        return this.#state.hovered;
    }

    set hovered(value: boolean) {
        this.#state.hovered = value;
    }

    /**
     * When set, this indicates that a widget is currently being hovered over this target.
     */
    get actionWidget() {
        return this.#state.actionWidget;
    }

    set actionWidget(value: FlexiTargetActionWidget | null) {
        this.#state.actionWidget = value;
    }

    /**
     * Whether the target is prepared and ready to render widgets.
     */
    get prepared() {
        return this.#state.prepared;
    }

    set prepared(value: boolean) {
        this.#state.prepared = value;
    }

    /**
     * The number of columns currently being used in the target grid.
     * This value is readonly.
     */
    get columns() {
        return this.#grid?.columns;
    }

    /**
     * The number of rows currently being used in the target grid.
     * This value is readonly.
     */
    get rows() {
        return this.#grid?.rows;
    }

    get grid() {
        const grid = this.#grid;
        if(!grid) {
            throw new Error("Grid is not initialised. Ensure that a FlexiGrid has been created before accessing it.");
        }
        return grid;
    }

    get dropzoneWidget() {
        return this.#dropzoneWidget.value;
    }

    set dropzoneWidget(value: FlexiWidget | null) {
        this.#dropzoneWidget.value = value;
    }
}

type FlexiTargetActionWidget = {
    action: WidgetAction["action"];
    widget: FlexiWidget;
}

type FlexiTargetState = {
    /**
     * Whether the target is currently being hovered over by the mouse.
     */
    hovered: boolean;

    /**
     * When set, this indicates a widget action that is currently being performed (or is focused) on this target.
     */
    actionWidget: FlexiTargetActionWidget | null;

    /**
     * Whether the target is mounted and ready to render widgets.
     */
    prepared: boolean;
}

const contextKey = Symbol('flexitarget');

/**
 * Creates a new FlexiTarget instance in the context of the current FlexiBoard.
 * @returns A FlexiTarget class instance.
 */
function flexitarget(config?: FlexiTargetConfiguration, key?: string) {
    const provider = getFlexiboardCtx();
    const target = new FlexiTarget(provider, config, key);

    setContext(contextKey, target);

    return {
        onpointerenter: () => target.onpointerenter(),
        onpointerleave: () => target.onpointerleave(),
        onwidgetgrabbed: (event: WidgetGrabbedEvent) => target.onwidgetgrabbed(event),
        target
    };
}

function getFlexitargetCtx() {
    const target = getContext<FlexiTarget | undefined>(contextKey);

    // No provider to attach to.
    if(!target) {
        throw new Error("Cannot get FlexiTarget context outside of a registered target. Ensure that flexitarget() (or <FlexiTarget>) is called within a <FlexiBoard> component.");
    }

    return target;
}

export {
    type FlexiTarget,
    flexitarget,
    getFlexitargetCtx
}