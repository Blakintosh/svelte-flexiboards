import type { FlexiWidget, FlexiWidgetChildrenSnippet, FlexiWidgetClasses } from "./widget.svelte.js";
import type { FlexiTarget } from "./target.svelte.js";
import type { PointerPositionWatcher } from "./utils.svelte.js";
import type { Component } from "svelte";

export type ProxiedValue<T> = {
    value: T;
}

export type SvelteClassValue = string | import('clsx').ClassArray | import('clsx').ClassDictionary | undefined | null;

export type Position = {
    x: number;
    y: number;
}

export type WidgetResizability = "none" | "horizontal" | "vertical" | "both";

export type WidgetGrabAction = {
    action: 'grab';
    widget: FlexiWidget;
    target: FlexiTarget;
    offsetX: number;
    offsetY: number;
    positionWatcher: PointerPositionWatcher;
    capturedHeightPx: number;
    capturedWidthPx: number;
}

export type WidgetResizeAction = {
    action: 'resize';
    widget: FlexiWidget;
    target: FlexiTarget;
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

export type WidgetStartResizeEvent = {
    widget: FlexiWidget;
    target: FlexiTarget;
    xOffset: number;
    yOffset: number;
    left: number;
    top: number;
    heightPx: number;
    widthPx: number;
}

export type WidgetDroppedEvent = {
    widget: FlexiWidget;
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