import { getContext, setContext } from "svelte";
import { getFlexiboardCtx, type FlexiBoard } from "./provider.svelte.js";
import { FlexiWidget, type BoardWidgetConfiguration, type FlexiWidgetChildrenSnippet, type FlexiWidgetClasses } from "./widget.svelte.js";
import type { FlexiTargetConfiguration, FlexiTargetDefaults, FlexiTargetPartialConfiguration, GrabbedWidgetMouseEvent, MouseGridCellMoveEvent, Position, ProxiedValue, WidgetDroppedEvent, WidgetGrabbedEvent } from "./types.js";
import { SvelteSet } from "svelte/reactivity";
import { FlowFlexiGrid, FlexiGrid, FreeFormFlexiGrid } from "./grid.svelte.js";

class FlexiTarget {
    widgets: SvelteSet<FlexiWidget> = $state(new SvelteSet());

    provider: FlexiBoard;
    #providerTargetDefaults: FlexiTargetDefaults | undefined = $state(undefined);

    /**
     * Stores the underlying state of the target.
     */
    #state: FlexiTargetState = $state({ 
        hovered: false,
        widgetOver: null,
        rendered: false
    });

    #dropzoneWidget: ProxiedValue<FlexiWidget | null> = $state({
        value: null
    });

    #mouseCellPosition: Position = $state({
        x: 0,
        y: 0
    });

    #targetConfig: FlexiTargetPartialConfiguration = $state({});

    #grid: FlexiGrid | null = null;

    #gridSnapshot: unknown | null = null;

    config: FlexiTargetConfiguration = $derived({
        capacity: this.#targetConfig.capacity ?? this.#providerTargetDefaults?.capacity ?? undefined,
        minColumns: this.#targetConfig.minColumns ?? this.#providerTargetDefaults?.minColumns ?? undefined,
        minRows: this.#targetConfig.minRows ?? this.#providerTargetDefaults?.minRows ?? undefined,
        layout: this.#targetConfig.layout ?? this.#providerTargetDefaults?.layout ?? {
            type: "free"
        }
    });

    style: string = $derived.by(() => {
        return `grid-template-columns: repeat(${this.columns}, 1fr); grid-template-rows: repeat(${this.rows}, 1fr);`;
    });
    
    constructor(provider: FlexiBoard, config?: FlexiTargetPartialConfiguration) {
        this.provider = provider;
        this.#providerTargetDefaults = provider.config?.targetDefaults;
        if(config) {
            this.#targetConfig = config;
        }

        $inspect(this.config);
        provider.addTarget(this);

        // Once mounted, switch from our pre-rendered widgets to the actual interactive widgets.
        $effect(() => {
            this.rendered = true;
        });
    }

    tryAddWidget(widget: FlexiWidget, x?: number, y?: number): boolean {
        // TODO: Dense layouts must be able to figure out the x and y coordinates of the widget.
        const added = this.grid.tryPlaceWidget(widget, x, y);
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

    createWidget(config: BoardWidgetConfiguration, snippet: FlexiWidgetChildrenSnippet | undefined, className: FlexiWidgetClasses | undefined) {
        const [x, y] = [config.x, config.y];
        const widget = new FlexiWidget(this, config, snippet, className);
        
        if(!this.tryAddWidget(widget, x, y)) {
            throw new Error("Failed to add widget to target. Check that the widget's x and y coordinates do not lead to an unresolvable collision.");
        }

        return widget;
    }

    #createShadow(of: FlexiWidget) {
        const shadow = new FlexiWidget(this, {
            width: of.width,
            height: of.height,
            component: of.component,
            draggable: of.draggable,
            resizable: of.resizable
        }, of.snippet, of.className, true);
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
        console.log("pointer is leaving")

        this.provider.onpointerleavetarget({
            target: this
        });
    }

    onwidgetgrabbed(event: WidgetGrabbedEvent) {
        // Remove the widget from the grid as it's now in a floating state.
        this.grid.removeWidget(event.widget);

        return this.provider.onwidgetgrabbed(event);
    }

    onwidgetdropped(event: WidgetDroppedEvent) {
        console.log("widget dropped", event.widget);
        this.widgetOver = null;
        this.#removeDropzoneWidget();

        // Try to formally place the widget in the grid, which will also serve as a final check that
        // the drop is possible.
        const grid = this.grid;

        const position = grid.mouseCellPosition;
        const canPlace = grid.tryPlaceWidget(event.widget, position.x, position.y);

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
        this.widgetOver = event.widget;

        this.#createDropzoneWidget();
    }

    ongrabbedwidgetleave() {
        console.log("grabbed widget leave", this.widgetOver);
        this.widgetOver = null;
        this.#removeDropzoneWidget();
    }

    #updateMouseCellPosition(x: number, y: number) {
        this.#mouseCellPosition.x = x;
        this.#mouseCellPosition.y = y;
    }

    #createDropzoneWidget() {
        if(this.dropzoneWidget || !this.widgetOver) {
            return;
        }
        const grid = this.grid;

        // Take a snapshot of the grid so we can restore its state if the hover stops.
        this.#gridSnapshot = grid.takeSnapshot();

        console.log("create dropzone widget", this.widgetOver);
        this.dropzoneWidget = this.#createShadow(this.widgetOver);

        console.log("DROPonz widget will be placed at", this.#mouseCellPosition.x, this.#mouseCellPosition.y);
        console.log("dropzone widget", this.dropzoneWidget);

        grid.tryPlaceWidget(this.dropzoneWidget, this.#mouseCellPosition.x, this.#mouseCellPosition.y);
    }

    #updateDropzoneWidget() {

        if(!this.dropzoneWidget || (this.dropzoneWidget.x === this.#mouseCellPosition.x && this.dropzoneWidget.y === this.#mouseCellPosition.y)) {
            return;
        }

        // The dropzone position has changed, so we need to reposition it in the grid.
        const grid = this.grid;

        grid.removeWidget(this.dropzoneWidget);
        grid.restoreFromSnapshot(this.#gridSnapshot!);

        grid.tryPlaceWidget(this.dropzoneWidget, this.#mouseCellPosition.x, this.#mouseCellPosition.y);
    }

    #removeDropzoneWidget() {
        console.log("remove dropzone widget", this.dropzoneWidget);
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
    get widgetOver() {
        return this.#state.widgetOver;
    }

    set widgetOver(value: FlexiWidget | null) {
        this.#state.widgetOver = value;
    }

    /**
     * Whether the target is mounted and ready to render widgets.
     */
    get rendered() {
        return this.#state.rendered;
    }

    set rendered(value: boolean) {
        this.#state.rendered = value;
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

    // get debug_gridLayout() {
    //     return this.grid.layout;
    // }

    // get debug_gridBitmaps() {
    //     return this.grid.bitmaps;
    // }

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

type FlexiTargetState = {
    /**
     * Whether the target is currently being hovered over by the mouse.
     */
    hovered: boolean;

    /**
     * When set, this indicates that a grabbed widget is currently hovering over this target.
     */
    widgetOver: FlexiWidget | null;

    /**
     * Whether the target is mounted and ready to render widgets.
     */
    rendered: boolean;
}

const contextKey = Symbol('flexitarget');

/**
 * Creates a new FlexiTarget instance in the context of the current FlexiBoard.
 * @returns A FlexiTarget class instance.
 */
function flexitarget(config?: FlexiTargetConfiguration) {
    const provider = getFlexiboardCtx();
    const target = new FlexiTarget(provider, config);

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