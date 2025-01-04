import type { FlexiWidget } from "./widget.svelte.js";
import type { FlexiTarget } from "./target.svelte.js";
import type { PointerPositionWatcher } from "./utils.svelte.js";

export type ProxiedValue<T> = {
    value: T;
}

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
    // TODO: Look at this again when we have more features done.
    expansionStrategy?: ExpansionStrategy;
    capacity?: number;
    minColumns?: number;
    minRows?: number;

    layout?: TargetLayout;
};
export type FlexiTargetPartialConfiguration = FlexiTargetDefaults;

export type FlexiTargetConfiguration = FlexiTargetDefaults & {
    layout: TargetLayout;
};

// TODO: We want to do different layouts, which specify strategy.
// append/prepend must be dense, they'll insert at the end.
// insert might be dense, might be sparse.
export type FlowTargetLayout = {
    type: "flow";

    /**
     * Specifies how widgets should be added when no coordinates are specified.
     * 
     * - "append" will add a widget after the last widget in the grid.
     * - "prepend" will add a widget before the first widget in the grid.
     */
    placementStrategy: "append" | "prepend";
    
    /**
     * When set to true, the grid will ignore coordinates provided when adding widgets and instead
     * default to the placement strategy's behaviour.
     */
    disallowInsert?: boolean;

    /**
     * The axis that widgets are placed along.
     * 
     * - When set to "row", widgets are added along the columns of a row before wrapping to the next row.
     * - When set to "column", widgets are added along the rows of a column before wrapping to the next column.
     */
    flowAxis: "row" | "column";

    /**
     * Whether the grid should be blocked from automatically expanding when all cell space is used.
     * 
     * - When unset and the flow axis is set to "row", the grid will create new rows when the last row is full.
     * - When unset and the flow axis is set to "column", the grid will create new columns when the last column is full.
     * - When set to true, the grid will be at capacity when all cells are used.
     */
    disallowExpansion?: boolean;

    /**
     * The maximum number of rows or columns that can be used depending on what the flow axis is set to.
     * 
     * - When flowAxis is set to "row", the grid will not allow more rows than this value.
     * - When flowAxis is set to "column", the grid will not allow more columns than this value.
     */
    maxFlowAxis?: number;
};

export type FreeFormTargetLayout = {
    type: "free";
    expandColumns?: boolean;
    expandRows?: boolean;
}

export type TargetLayout = FlowTargetLayout | FreeFormTargetLayout;

type ExpansionStrategy = "none" | "column" | "row" | "both";

export type Position = {
    x: number;
    y: number;
}

export type GrabbedWidget = {
    widget: FlexiWidget;
    target: FlexiTarget;
    offsetX: number;
    offsetY: number;
    positionWatcher: PointerPositionWatcher;
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
    position: Position;
    preventDefault: () => void;
}

export type WidgetOverEvent = {
    widget: FlexiWidget;
    mousePosition: Position;
}

export type WidgetOutEvent = {
    widget: FlexiWidget;
}

export type MouseGridCellMoveEvent = {
    cellX: number;
    cellY: number;
}

export type GrabbedWidgetMouseEvent = {
    widget: FlexiWidget;
}

export type HoveredTargetEvent = {
    target: FlexiTarget;
}