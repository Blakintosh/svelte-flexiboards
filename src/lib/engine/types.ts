import type { FlexiWidget } from "./widget.svelte.js";
import type { FlexiTarget } from "./target.svelte.js";
import type { MousePositionWatcher } from "./utils.svelte.js";

export type FlexiBoardConfiguration = {
    widgetDefaults?: FlexiWidgetDefaults;
    targetDefaults?: FlexiTargetDefaults;
};

export type FlexiWidgetDefaults = {
    draggable?: boolean;
    resizable?: boolean;
    width?: number;
    height?: number;
};
export type FlexiWidgetConfiguration = FlexiWidgetDefaults;

export type FlexiTargetDefaults = {
    placementStrategy?: PlacementStrategy;
    // TODO: Look at this again when we have more features done.
    expansionStrategy?: ExpansionStrategy;
    capacity?: number;
    columns?: number;
    rows?: number;

    /**
     * Whether columns should be expanded to fit a widget that's being moved or placed beyond existing bounds.
     */
    expandColumns?: boolean;
    
    /**
     * Whether rows should be expanded to fit a widget that's being moved or placed beyond existing bounds.
     */
    expandRows?: boolean;

    layout?: TargetLayout;
};
export type FlexiTargetConfiguration = FlexiTargetDefaults;

type SimpleRowLayout = {
    rows: number;
}

type SimpleColumnLayout = {
    columns: number;
}

type DenseRowAndColumnLayout = {
    rows: number;
    columns: number;
    fillDirection: "row" | "column";
}

// TODO: We want to do different layouts, which specify strategy.
// append/prepend must be dense, they'll insert at the end.
// insert might be dense, might be sparse.
type DenseTargetLayout = (SimpleRowLayout | SimpleColumnLayout | DenseRowAndColumnLayout) & {
    type: "dense";
};

type SparseTargetLayout = {
    type: "sparse";
    // placementStrategy: "insert";
}

type TargetLayout = DenseTargetLayout | SparseTargetLayout;

type PlacementStrategy = "insert" | "append" | "prepend";
type ExpansionStrategy = "none" | "column" | "row" | "both";

export type MousePosition = {
    x: number;
    y: number;
}

export type GrabbedWidget = {
    widget: FlexiWidget;
    target: FlexiTarget;
    offsetX: number;
    offsetY: number;
    positionWatcher: MousePositionWatcher;
    capturedHeight: number;
    capturedWidth: number;
}   

// Event objects

/**
 * Event object that captures widget grabbed event data.
 */
export type WidgetGrabbedEvent = {
    widget: FlexiWidget;
    target: FlexiTarget;
    xOffset: number;
    yOffset: number;
    capturedHeight: number;
    capturedWidth: number;
}

export type WidgetDroppedEvent = {
    widget: FlexiWidget;
    position: MousePosition;
    preventDefault: () => void;
}

export type WidgetOverEvent = {
    widget: FlexiWidget;
    mousePosition: MousePosition;
}

export type WidgetOutEvent = {
    widget: FlexiWidget;
}

export type MouseGridCellMoveEvent = {
    cellX: number;
    cellY: number;
}

export type GrabbedWidgetOverEvent = {
    widget: FlexiWidget;
}