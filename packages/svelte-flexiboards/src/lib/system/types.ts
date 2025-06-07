import type { FlexiTargetController, InternalFlexiTargetController } from './target.svelte.js';
import type { PointerService } from './shared/utils.svelte.js';
import type { Component } from 'svelte';
import type { FlexiAddController } from './manage.svelte.js';
import type { FlexiWidgetController } from './widget/base.svelte.js';
import type { FlexiWidgetConfiguration } from './widget/types.js';

export type ProxiedValue<T> = {
	value: T;
};
export type Position = {
	x: number;
	y: number;
};

export type FlexiCommonProps<T> = {
	controller?: T;
	onfirstcreate?: (instance: T) => void;
};

export type WidgetResizability = 'none' | 'horizontal' | 'vertical' | 'both';

export type WidgetGrabAction = {
	action: 'grab';
	widget: FlexiWidgetController;
	offsetX: number;
	offsetY: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
};

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
};

export type WidgetAction = WidgetGrabAction | WidgetResizeAction;

export type WidgetGrabbedParams = {
	widget: FlexiWidgetController;
	ref: HTMLElement;
	xOffset: number;
	yOffset: number;
	clientX: number;
	clientY: number;
	capturedHeight: number;
	capturedWidth: number;
};

export type WidgetStartResizeParams = {
	widget: FlexiWidgetController;
	xOffset: number;
	yOffset: number;
	left: number;
	top: number;
	heightPx: number;
	widthPx: number;
};

// Event objects
export type WidgetGrabbedEvent = {
	widget: FlexiWidgetController;
	target?: FlexiTargetController;
	adder?: FlexiAddController;
	clientX: number;
	clientY: number;
	xOffset: number;
	yOffset: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
};

export type WidgetResizingEvent = {
	widget: FlexiWidgetController;
	target: FlexiTargetController;
	offsetX: number;
	offsetY: number;
	left: number;
	top: number;
};

export type WidgetReleaseEvent = {
	widget: FlexiWidgetController;
};

export type WidgetCancelEvent = {
	widget: FlexiWidgetController;
};

export type WidgetStartResizeEvent = WidgetStartResizeParams & {
	target: InternalFlexiTargetController;
};

export type WidgetOverEvent = {
	widget: FlexiWidgetController;
	mousePosition: Position;
};

export type WidgetOutEvent = {
	widget: FlexiWidgetController;
};

export type MouseGridCellMoveEvent = {
	cellX: number;
	cellY: number;
};

export type GrabbedWidgetMouseEvent = {
	widget: FlexiWidgetController;
};

export type HoveredTargetEvent = {
	target: InternalFlexiTargetController;
};

export type FlexiSavedLayout = Record<string, FlexiWidgetConfiguration[]>;

export type WidgetActionEvent =
	| (PointerEvent & { isKeyboard?: undefined })
	| (KeyboardEvent & { isKeyboard: true; clientX: number; clientY: number });
