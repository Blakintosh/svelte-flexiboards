import type { FlexiLayout } from './board/types.js';
import type { InternalFlexiBoardController } from './board/controller.svelte.js';
import type { InternalFlexiAddController } from './misc/adder.svelte.js';
import type { InternalResponsiveFlexiBoardController } from './responsive/controller.svelte.js';
import type { InternalFlexiTargetController } from './target/controller.svelte.js';
import type { InternalFlexiWidgetController } from './widget/controller.svelte.js';
import type { Position } from './types.js';

export type InternalWidgetGrabAction = {
	action: 'grab';
	widget: InternalFlexiWidgetController;
	offsetX: number;
	offsetY: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
	// The pointer that initiated the action; undefined for keyboard-initiated actions.
	pointerId?: number;
};

export type InternalWidgetResizeAction = {
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
	// The pointer that initiated the action; undefined for keyboard-initiated actions.
	pointerId?: number;
};

export type InternalWidgetAction = InternalWidgetGrabAction | InternalWidgetResizeAction;

export type InternalWidgetGrabbedParams = {
	widget: InternalFlexiWidgetController;
	ref: HTMLElement;
	xOffset: number;
	yOffset: number;
	clientX: number;
	clientY: number;
	capturedHeight: number;
	capturedWidth: number;
};

export type InternalWidgetStartResizeParams = {
	widget: InternalFlexiWidgetController;
	xOffset: number;
	yOffset: number;
	left: number;
	top: number;
	heightPx: number;
	widthPx: number;
};

export type InternalAdderWidgetReadyEvent = {
	adder: InternalFlexiAddController;
	widget: InternalFlexiWidgetController;
};

export type InternalWidgetEvent = {
	target?: InternalFlexiTargetController;
	board: InternalFlexiBoardController;
	widget: InternalFlexiWidgetController;
};

export type InternalWidgetGrabbedEvent = InternalWidgetEvent & {
	clientX: number;
	clientY: number;
	xOffset: number;
	yOffset: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
	// The pointer that initiated the grab; undefined for keyboard-initiated grabs.
	pointerId?: number;
};

export type InternalWidgetResizingEvent = InternalWidgetEvent & {
	target: InternalFlexiTargetController;
	offsetX: number;
	offsetY: number;
	clientX: number;
	clientY: number;
	left: number;
	top: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
	// The pointer that initiated the resize; undefined for keyboard-initiated resizes.
	pointerId?: number;
};

export type InternalWidgetDroppedEvent = {
	widget: InternalFlexiWidgetController;
	board: InternalFlexiBoardController;
	oldTarget?: InternalFlexiTargetController;
	newTarget?: InternalFlexiTargetController;
};

export type InternalWidgetStartResizeEvent = InternalWidgetStartResizeParams & {
	target: InternalFlexiTargetController;
};

export type InternalWidgetOverEvent = {
	widget: InternalFlexiWidgetController;
	mousePosition: Position;
};

export type InternalWidgetOutEvent = {
	widget: InternalFlexiWidgetController;
};

export type InternalTargetEvent = {
	board: InternalFlexiBoardController;
	target: InternalFlexiTargetController;
};

export type InternalGrabbedWidgetMouseEvent = {
	widget: InternalFlexiWidgetController;
};

export type InternalHoveredTargetEvent = {
	target: InternalFlexiTargetController;
};

export type InternalBoardLayoutChangeEvent = {
	board: InternalFlexiBoardController;
	layout: FlexiLayout;
	breakpoint?: string;
};

export type InternalResponsiveLayoutImportEvent = {
	responsiveController: InternalResponsiveFlexiBoardController;
};
