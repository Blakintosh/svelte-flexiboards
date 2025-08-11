import type { FlexiTargetController } from './target/index.js';
import type { InternalFlexiTargetController } from './target/controller.svelte.js';
import type { PointerService } from './shared/utils.svelte.js';
import type { Component } from 'svelte';
import type { FlexiAddController, InternalFlexiAddController } from './misc/adder.svelte.js';
import type { FlexiWidgetController } from './widget/base.svelte.js';
import type { FlexiWidgetConfiguration } from './widget/types.js';
import type { FlexiBoardController } from './board/base.svelte.js';
import type { InternalFlexiBoardController } from './board/controller.svelte.js';
import type { InternalFlexiWidgetController } from './widget/controller.svelte.js';

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
	widget: InternalFlexiWidgetController;
	offsetX: number;
	offsetY: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
};

export type WidgetResizeAction = {
	action: 'resize';
	widget: InternalFlexiWidgetController;
	offsetX: number;
	offsetY: number;
	left: number;
	top: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
	initialHeightUnits: number;
	initialWidthUnits: number;
};

export type WidgetAction = WidgetGrabAction | WidgetResizeAction;

export type WidgetGrabbedParams = {
	widget: InternalFlexiWidgetController;
	ref: HTMLElement;
	xOffset: number;
	yOffset: number;
	clientX: number;
	clientY: number;
	capturedHeight: number;
	capturedWidth: number;
};

export type WidgetStartResizeParams = {
	widget: InternalFlexiWidgetController;
	xOffset: number;
	yOffset: number;
	left: number;
	top: number;
	heightPx: number;
	widthPx: number;
};

export type AdderWidgetReadyEvent = {
	adder: InternalFlexiAddController;
	widget: InternalFlexiWidgetController;
};

export type WidgetEvent = {
	target?: InternalFlexiTargetController;
	board: InternalFlexiBoardController;
	widget: InternalFlexiWidgetController;
};

export type WidgetDeleteEvent = {
	widget: InternalFlexiWidgetController;
};

// Event objects
export type WidgetGrabbedEvent = WidgetEvent & {
	adder?: FlexiAddController;
	clientX: number;
	clientY: number;
	xOffset: number;
	yOffset: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
};

export type WidgetResizingEvent = WidgetEvent & {
	target: InternalFlexiTargetController;
	offsetX: number;
	offsetY: number;
	clientX: number;
	clientY: number;
	left: number;
	top: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
};

export type WidgetDroppedEvent = {
	widget: InternalFlexiWidgetController;
	board: InternalFlexiBoardController;
	oldTarget?: InternalFlexiTargetController;
	newTarget?: InternalFlexiTargetController;
};

export type WidgetStartResizeEvent = WidgetStartResizeParams & {
	target: InternalFlexiTargetController;
};

export type WidgetOverEvent = {
	widget: InternalFlexiWidgetController;
	mousePosition: Position;
};

export type WidgetOutEvent = {
	widget: InternalFlexiWidgetController;
};

export type TargetEvent = {
	board: InternalFlexiBoardController;
	target: InternalFlexiTargetController;
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
