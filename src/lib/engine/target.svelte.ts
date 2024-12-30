import { getContext, setContext } from "svelte";
import { getFlexiboardCtx, type FlexiBoard } from "./provider.svelte.js";
import { FlexiWidget, type BoardWidgetConfiguration, type FlexiWidgetChildrenSnippet } from "./widget.svelte.js";
import type { FlexiTargetConfiguration, FlexiTargetDefaults, GrabbedWidgetOverEvent, MouseGridCellMoveEvent, WidgetDroppedEvent, WidgetGrabbedEvent } from "./types.js";
import { SvelteSet } from "svelte/reactivity";
import { FlexiGrid, type GridSnapshot } from "./grid.svelte.js";

type DropzoneWidget = {
    widget: FlexiWidget | null;
    position: {
        x: number;
        y: number;
    } | null;
}

class FlexiTarget {
    onmouseenter: () => void;
    onmouseleave: () => void;
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

    #dropzoneWidget: DropzoneWidget = $state({
        widget: null,
        position: null
    });

    #targetConfig: FlexiTargetConfiguration = $state({});

    #grid: FlexiGrid;

    #gridSnapshot: GridSnapshot | null = null;

    config: FlexiTargetConfiguration = $derived({
        placementStrategy: this.#targetConfig.placementStrategy ?? this.#providerTargetDefaults?.placementStrategy ?? "append",
        expansionStrategy: this.#targetConfig.expansionStrategy ?? this.#providerTargetDefaults?.expansionStrategy ?? "row",
        capacity: this.#targetConfig.capacity ?? this.#providerTargetDefaults?.capacity ?? undefined,
        columns: this.#targetConfig.columns ?? this.#providerTargetDefaults?.columns ?? undefined,
        rows: this.#targetConfig.rows ?? this.#providerTargetDefaults?.rows ?? undefined,
        layout: this.#targetConfig.layout ?? this.#providerTargetDefaults?.layout ?? {
            type: "sparse"
        },
        expandColumns: this.#targetConfig.expandColumns ?? this.#providerTargetDefaults?.expandColumns ?? false,
        expandRows: this.#targetConfig.expandRows ?? this.#providerTargetDefaults?.expandRows ?? false
    });

    style: string = $derived.by(() => {
        return `grid-template-columns: repeat(${this.columns}, 1fr); grid-template-rows: repeat(${this.rows}, 1fr);`;
    });
    
    constructor(provider: FlexiBoard, config?: FlexiTargetConfiguration) {
        this.provider = provider;
        this.#providerTargetDefaults = provider.config?.targetDefaults;
        if(config) {
            this.#targetConfig = config;
        }

        $inspect(this.config);
        const { onmouseenter, onmouseleave } = provider.addTarget(this);

        this.onmouseenter = onmouseenter;
        this.onmouseleave = onmouseleave;

        // Once mounted, switch from our pre-rendered widgets to the actual interactive widgets.
        $effect(() => {
            this.rendered = true;
        });

        this.initDropzone();
    }

    tryAddWidget(widget: FlexiWidget, x?: number, y?: number): boolean {
        // TODO: Dense layouts must be able to figure out the x and y coordinates of the widget.
        const added = this.#grid.tryPlaceWidget(widget, x, y);
        if(added) {
            this.widgets.add(widget);
        }
        return added;
    }

    createGrid() {
        if(this.#grid) {
            console.warn("A grid already exists but is being replaced. If this is due to a hot reload, this is no cause for alarm.");
        }

        this.#grid = new FlexiGrid(this, this.#targetConfig);
        return this.#grid;
    }

    createWidget(config: BoardWidgetConfiguration, snippet: FlexiWidgetChildrenSnippet | undefined, className: string | undefined) {
        const [x, y] = [config.x, config.y];

        if(this.config.layout!.type == "sparse" && (x === undefined || y === undefined)) {
            throw new Error("Missing required x and y fields for a widget in a sparse target layout. The x- and y- coordinates of a widget cannot be automatically inferred in this context.");
        }
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

    initDropzone() {
        // This effect monitors whether the target is currently hovered, and if a widget is currently being grabbed
        // it will create a dropzone widget to indicate where the widget will be dropped.

        $effect(() => {
            // Show a shadow of the grabbed widget that's currently hovering over this target.
            if(this.hovered && this.widgetOver && !this.#dropzoneWidget.widget && this.#dropzoneWidget.position) {
                this.#dropzoneWidget.widget = this.#createShadow(this.widgetOver);

                this.#grid.tryPlaceWidget(this.#dropzoneWidget.widget, this.#dropzoneWidget.position!.x, this.#dropzoneWidget.position!.y);
                return;
            }

            // There was a grabbed widget hovering over this target, but it's not anymore.
            if(!this.widgetOver && this.#dropzoneWidget.widget) {
                this.widgets.delete(this.#dropzoneWidget.widget);
                this.#grid.removeWidget(this.#dropzoneWidget.widget);

                this.#grid.restoreFromSnapshot(this.#gridSnapshot!);
                this.#gridSnapshot = null;

                this.#dropzoneWidget.widget = null;
                // this.#dropzoneWidget.position = null;
            }
        });
    }

    // Events
    onwidgetgrabbed(event: WidgetGrabbedEvent) {
        this.widgetOver = event.widget;

        console.log("widget grabbed at ", this.widgetOver.x, this.widgetOver.y);

        // Set this now before the widget is removed from the grid, otherwise we'll no longer have this information.
        this.#dropzoneWidget.position = {
            x: this.widgetOver.x,
            y: this.widgetOver.y
        };

        // Remove the widget from the grid.
        this.#grid.removeWidget(event.widget);

        this.#gridSnapshot = this.#grid.takeSnapshot();

        return this.provider.onwidgetgrabbed(event);
    }

    onwidgetdropped(event: WidgetDroppedEvent) {
        this.widgetOver = null;

        this.#grid.removeWidget(this.#dropzoneWidget.widget!);
        this.widgets.delete(this.#dropzoneWidget.widget!);
        this.#dropzoneWidget.widget = null;
        this.#dropzoneWidget.position = null;

        this.#grid.restoreFromSnapshot(this.#gridSnapshot!);


        const position = this.#grid.mouseCellPosition;
        const canPlace = this.#grid.tryPlaceWidget(event.widget, position.x, position.y);
        if(!canPlace) {
            event.preventDefault();
            console.log("Restoring grid snapshot");
            this.#grid.restoreFromSnapshot(this.#gridSnapshot!);
        }
    }

    onmousegridcellmove(event: MouseGridCellMoveEvent) {
        console.log("mouse grid cell move at ", event.cellX, event.cellY);

        // console.log("Does the widget exist?", !!this.#dropzoneWidget.widget);
        // console.log("Does the position exist?", !!this.#dropzoneWidget.position);

        if(this.widgetOver && !this.#dropzoneWidget.widget) {
            this.#gridSnapshot = this.#grid.takeSnapshot();
            this.#dropzoneWidget.widget = this.#createShadow(this.widgetOver);
        }

        if(this.#dropzoneWidget.widget && this.#dropzoneWidget.position) {
            if(event.cellX === this.#dropzoneWidget.position.x && event.cellY === this.#dropzoneWidget.position.y) {
                return;
            }

            console.log("widget is at ", event.cellX, event.cellY);

            this.#dropzoneWidget.position = {
                x: event.cellX,
                y: event.cellY
            };


            this.#grid.removeWidget(this.#dropzoneWidget.widget);
            this.#grid.restoreFromSnapshot(this.#gridSnapshot!);

            this.#grid.tryPlaceWidget(this.#dropzoneWidget.widget, this.#dropzoneWidget.position.x, this.#dropzoneWidget.position.y);
        }
    }

    ongrabbedwidgetover(event: GrabbedWidgetOverEvent) {
        // TODO: This doesn't always fire. We want to obsolete the effect that monitors .widgetOver, as it's a bit hacky.
        // Generally, the app should follow the general principle of events change state, not state changes state.

        // TODO: Additionally, move the onmouseover/onmouseleave events into this file, as it doesn't make sense that the provider creates them.
        console.log("grabbed widget over !");
        this.widgetOver = event.widget;
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

    get gridRef() {
        return this.#grid.ref;
    }

    set gridRef(value: HTMLElement | null) {
        this.#grid.ref = value;
    }

    get debug_gridLayout() {
        return this.#grid.layout;
    }

    get debug_gridBitmaps() {
        return this.#grid.bitmaps;
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
        onmouseenter: () => target.onmouseenter(),
        onmouseleave: () => target.onmouseleave(),
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