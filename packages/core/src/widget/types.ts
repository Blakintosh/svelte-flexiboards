import type { ClassValue, FlexiComponent, FlexiContent } from '../types.js';

import type { FlexiWidgetController } from './base.js';
import {
	immediateTriggerConfig,
	longPressTriggerConfig,
	type PointerTriggerCondition
} from './triggers.js';
import type { WidgetAction, WidgetDraggability, WidgetResizability } from '../types.js';
import type { InternalFlexiTargetController } from '../target/controller.js';
import type { InternalFlexiBoardController } from '../board/controller.js';

export type FlexiWidgetChildrenSnippetParameters = {
	widget: FlexiWidgetController;
};
export type FlexiWidgetChildrenSnippet = FlexiContent;

export type FlexiWidgetClassFunction = (widget: FlexiWidgetController) => ClassValue;
export type FlexiWidgetClasses = ClassValue | FlexiWidgetClassFunction;

export type FlexiWidgetTransitionTypeConfiguration = {
	duration?: number;
	easing?: string;
};

export type FlexiWidgetTransitionConfiguration = {
	move?: FlexiWidgetTransitionTypeConfiguration;
	drop?: FlexiWidgetTransitionTypeConfiguration;
	resize?: FlexiWidgetTransitionTypeConfiguration;
};

export type FlexiWidgetTriggerConfiguration = Record<string, PointerTriggerCondition>;

export type FlexiWidgetDefaults = {
	/**
	 * Whether the widget is draggable.
	 * @deprecated Prefer the use of `draggability` instead for finer control. When `true`, `draggability = 'full'`, when `false`, `draggability = 'none'`.
	 */
	draggable?: boolean;

	/**
	 * The draggability of the widget.
	 */
	draggability?: WidgetDraggability;

	/**
	 * The resizability of the widget.
	 */
	resizability?: WidgetResizability;

	/**
	 * The width of the widget in units.
	 * @deprecated This property does not work and will be removed in the next version.
	 */
	width?: number;

	/**
	 * The height of the widget in units.
	 * @deprecated This property does not work and will be removed in the next version.
	 */
	height?: number;

	/**
	 * The snippet that is rendered by this widget.
	 */
	snippet?: FlexiWidgetChildrenSnippet;

	/**
	 * The component that is rendered by this widget.
	 */
	component?: FlexiComponent;

	/**
	 * The props applied to the component rendered, if it has one.
	 */
	componentProps?: Record<string, any>;

	/**
	 * The class names to apply to this widget.
	 */
	className?: FlexiWidgetClasses;

	/**
	 * The transition configuration for this widget.
	 */
	transition?: FlexiWidgetTransitionConfiguration;

	/**
	 * The configuration for how pointer events should trigger a grab event
	 * on the widget. E.g. a long press.
	 */
	grabTrigger?: FlexiWidgetTriggerConfiguration;

	/**
	 * The configuration for how pointer events should trigger a resize event
	 * on the widget. E.g. a long press.
	 */
	resizeTrigger?: FlexiWidgetTriggerConfiguration;

	/**
	 * The minimum width of the widget in units. Defaults to 1, cannot be less than 1.
	 */
	minWidth?: number;

	/**
	 * The minimum height of the widget in units. Defaults to 1, cannot be less than 1.
	 */
	minHeight?: number;

	/**
	 * The maximum width of the widget in units. Defaults to Infinity, cannot be less than 1.
	 */
	maxWidth?: number;

	/**
	 * The maximum height of the widget in units. Defaults to Infinity, cannot be less than 1.
	 */
	maxHeight?: number;
};

export type FlexiWidgetConfiguration = FlexiWidgetDefaults & {
	/**
	 * A stable identifier for this widget, used for persistence and layout
	 * import/export.
	 */
	id?: string;

	/**
	 * The registry key used to look up shared configuration for this widget.
	 */
	type?: string;

	/**
	 * The starting column (x-coordinate) of the widget.
	 */
	x?: number;

	/**
	 * The starting row (y-coordinate) of the widget.
	 */
	y?: number;

	/**
	 * The width of the widget in units.
	 */
	width?: number;

	/**
	 * The height of the widget in units.
	 */
	height?: number;

	/**
	 * Arbitrary metadata associated with this widget, carried through layout
	 * export/import.
	 */
	metadata?: Record<string, any>;
};

export type FlexiWidgetState = {
	currentAction: WidgetAction | null;
	width: number;
	height: number;
	x: number;
	y: number;
};

export type FlexiWidgetDerivedConfiguration = {
	/**
	 * The component that is rendered by this item. This is optional if a snippet is provided.
	 */
	component?: FlexiComponent;

	/**
	 * The props applied to the component rendered, if it has one.
	 */
	componentProps?: Record<string, any>;

	/**
	 * The snippet that is rendered by this widget. This is optional when a component is provided. If used alongside component, then this snippet is passed the component and should render it.
	 */
	snippet?: FlexiWidgetChildrenSnippet;

	/**
	 * The resizability of the widget.
	 */
	resizability: WidgetResizability;

	/**
	 * Whether the widget is draggable.
	 * @deprecated Prefer the use of `draggability` instead for finer control. When `true`, `draggability = 'full'`, when `false`, `draggability = 'none'`.
	 */
	draggable: boolean;

	/**
	 * The draggability of the widget.
	 */
	draggability: WidgetDraggability;

	/**
	 * The class name that is applied to this widget.
	 */
	className?: FlexiWidgetClasses;

	/**
	 * The metadata associated with this widget, if any.
	 */
	metadata?: Record<string, any>;

	/**
	 * The configuration for how pointer events should trigger a grab event
	 * on the widget. E.g. a long press.
	 */
	grabTrigger: FlexiWidgetTriggerConfiguration;

	/**
	 * The configuration for how pointer events should trigger a resize event
	 * on the widget. E.g. a long press.
	 */
	resizeTrigger: FlexiWidgetTriggerConfiguration;

	/**
	 * The transition configuration for this widget.
	 */
	transition: FlexiWidgetTransitionConfiguration;

	/**
	 * The minimum width of the widget in units. Defaults to 1, cannot be less than 1.
	 */
	minWidth: number;

	/**
	 * The minimum height of the widget in units. Defaults to 1, cannot be less than 1.
	 */
	minHeight: number;

	/**
	 * The maximum width of the widget in units. Defaults to Infinity, cannot be less than 1.
	 */
	maxWidth: number;

	/**
	 * The maximum height of the widget in units. Defaults to Infinity, cannot be less than 1.
	 */
	maxHeight: number;
};

export type FlexiWidgetConstructorParams = {
	config: FlexiWidgetConfiguration;
	provider: InternalFlexiBoardController;
	target?: InternalFlexiTargetController;
	type?: string;
	isShadow?: boolean;
};

export const defaultTriggerConfig: FlexiWidgetTriggerConfiguration = {
	default: immediateTriggerConfig(),
	mouse: immediateTriggerConfig(),
	touch: longPressTriggerConfig(),
	pen: longPressTriggerConfig()
};
