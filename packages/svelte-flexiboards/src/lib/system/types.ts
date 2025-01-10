import type { FlexiWidgetController, FlexiWidgetChildrenSnippet, FlexiWidgetClasses, FlexiWidgetConfiguration } from "./widget.svelte.js";
import type { FlexiTargetController, InternalFlexiTargetController } from "./target.svelte.js";
import type { PointerPositionWatcher } from "./utils.svelte.js";
import type { Component } from "svelte";
import type { FlexiAddController } from "./manage.svelte.js";

export type ProxiedValue<T> = {
    value: T;
}

export type SvelteClassValue = string | import('clsx').ClassArray | import('clsx').ClassDictionary | undefined | null;

export type Position = {
    x: number;
    y: number;
}

export type FlexiCommonProps<T> = {
    controller?: T;
    onfirstcreate?: (instance: T) => void;
}

export type WidgetResizability = "none" | "horizontal" | "vertical" | "both";

export type WidgetGrabAction = {
    action: 'grab';
    widget: FlexiWidgetController;
    target?: FlexiTargetController;
    adder?: FlexiAddController;
    offsetX: number;
    offsetY: number;
    positionWatcher: PointerPositionWatcher;
    capturedHeightPx: number;
    capturedWidthPx: number;
}

export type WidgetResizeAction = {
    action: 'resize';
    widget: FlexiWidgetController;
    target: FlexiTargetController;
    offsetX: number;
    offsetY: number;
    left: number;
    top: number;
    heightPx: number;
    widthPx: number;
    initialHeightUnits: number;
    initialWidthUnits: number;
    positionWatcher: PointerPositionWatcher;
}   

export type WidgetAction = WidgetGrabAction | WidgetResizeAction;

export type WidgetGrabbedParams = {
    widget: FlexiWidgetController;
    xOffset: number;
    yOffset: number;
    capturedHeight: number;
    capturedWidth: number;
}

export type WidgetStartResizeParams = {
    widget: FlexiWidgetController;
    xOffset: number;
    yOffset: number;
    left: number;
    top: number;
    heightPx: number;
    widthPx: number;
}

// Event objects
export type WidgetGrabbedEvent = WidgetGrabbedParams & {
    target?: InternalFlexiTargetController;
    adder?: FlexiAddController;
};

export type WidgetStartResizeEvent = WidgetStartResizeParams & {
    target: InternalFlexiTargetController;
};

/**
 * Event object that captures widget grabbed event data.
 */
export type WidgetDroppedEvent = {
    widget: FlexiWidgetController;
    preventDefault: () => void;
}

export type WidgetOverEvent = {
    widget: FlexiWidgetController;
    mousePosition: Position;
}

export type WidgetOutEvent = {
    widget: FlexiWidgetController;
}

export type MouseGridCellMoveEvent = {
    cellX: number;
    cellY: number;
}

export type GrabbedWidgetMouseEvent = {
    widget: FlexiWidgetController;
}

export type HoveredTargetEvent = {
    target: InternalFlexiTargetController;
}

export type FlexiSavedLayout = Record<string, FlexiWidgetConfiguration[]>;
