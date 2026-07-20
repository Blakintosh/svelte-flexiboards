import type { FlexiTargetController } from './target/index.js';
import type { FlexiAddController } from './misc/adder.js';
import type { FlexiWidgetController } from './widget/base.js';
import type { FlexiBoardController } from './board/base.js';
import type { FlexiLayout } from './board/types.js';
import type { ResponsiveFlexiBoardController } from './responsive/base.js';

export type { Signal, ReadonlySignal } from './reactivity.js';

/**
 * Framework-erased render types. Core stores these opaquely; each framework
 * adapter narrows them (Svelte: Component/Snippet, React: ComponentType/render prop).
 * TODO(adapter-generics): consider replacing with a generic parameter threaded
 * through the widget/target/board configuration types so adapter re-exports
 * stay fully type-safe.
 */
export type FlexiComponent = unknown;
export type FlexiContent = unknown;

/** Framework-neutral replacement for svelte/elements' ClassValue. */
export type ClassValue = string | null | undefined | ClassValue[] | Record<string, boolean>;

export type Position = {
	x: number;
	y: number;
};

export type FlexiCommonProps<T> = {
	controller?: T;
	onfirstcreate?: (instance: T) => void;
};

export type WidgetResizability = 'none' | 'horizontal' | 'vertical' | 'both';
export type WidgetDraggability = 'none' | 'movable' | 'full';

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

export type PointerMovedEvent = {
	x: number;
	y: number;
};

export type AdderWidgetReadyEvent = {
	adder: FlexiAddController;
	widget: FlexiWidgetController;
};

export type WidgetEvent = {
	target?: FlexiTargetController;
	board: FlexiBoardController;
	widget: FlexiWidgetController;
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
	target: FlexiTargetController;
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
	widget: FlexiWidgetController;
	board: FlexiBoardController;
	oldTarget?: FlexiTargetController;
	newTarget?: FlexiTargetController;
};

export type WidgetStartResizeEvent = WidgetStartResizeParams & {
	target: FlexiTargetController;
};

export type WidgetOverEvent = {
	widget: FlexiWidgetController;
	mousePosition: Position;
};

export type WidgetOutEvent = {
	widget: FlexiWidgetController;
};

export type TargetEvent = {
	board: FlexiBoardController;
	target: FlexiTargetController;
};

export type MouseGridCellMoveEvent = {
	cellX: number;
	cellY: number;
	// Raw (fractional) cell coordinates before rounding - useful for resize snapping
	rawCellX: number;
	rawCellY: number;
};

export type GrabbedWidgetMouseEvent = {
	widget: FlexiWidgetController;
};

export type HoveredTargetEvent = {
	target: FlexiTargetController;
};

export type WidgetActionEvent =
	| (PointerEvent & { isKeyboard?: undefined })
	| (KeyboardEvent & { isKeyboard: true; clientX: number; clientY: number });

export type BoardLayoutChangeEvent = {
	board: FlexiBoardController;
	layout: FlexiLayout;
	breakpoint?: string;
};

export type ResponsiveLayoutImportEvent = {
	responsiveController: ResponsiveFlexiBoardController;
};
