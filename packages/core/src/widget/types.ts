import type { AnimationAdapter, AnimationBox, CssTransitionConfiguration } from './animation.js';
import type { FlexiComponent, FlexiContent } from '../types.js';

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

export type FlexiWidgetClassFunction<TClass = unknown> = (widget: FlexiWidgetController) => TClass;
export type FlexiWidgetClasses<TClass = unknown> = TClass | FlexiWidgetClassFunction<TClass>;

/**
 * How a widget animates for one kind of movement: either a plain `{ duration, easing }`
 * (a CSS transition) or an {@link AnimationAdapter}.
 */
export type FlexiWidgetTransitionTypeConfiguration =
	| CssTransitionConfiguration
	| AnimationAdapter<AnimationBox>;

export type FlexiWidgetTransitionConfiguration = {
	/**
	 * Plays when a widget moves between cells of a grid, including when it is pushed aside by another widget.
	 * Omit to play no animation.
	 */
	move?: FlexiWidgetTransitionTypeConfiguration;

	/**
	 * Plays when a grabbed widget is released and settles into its cell.
	 * Omit to play no animation.
	 */
	drop?: FlexiWidgetTransitionTypeConfiguration;

	/**
	 * Plays when a widget is released from a resize and settles at its new size.
	 * Omit to play no animation.
	 */
	resize?: FlexiWidgetTransitionTypeConfiguration;
};

export type FlexiWidgetTriggerConfiguration = Record<string, PointerTriggerCondition>;

export type FlexiWidgetDefaults<TClass = unknown> = {
	/**
	 * The draggability of the widget.
	 * @default full
	 */
	draggability?: WidgetDraggability;

	/**
	 * The resizability of the widget.
	 * @default none
	 */
	resizability?: WidgetResizability;

	/**
	 * The render function used for this widget's content.
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
	className?: FlexiWidgetClasses<TClass>;

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

export type FlexiWidgetConfiguration<TClass = unknown> = FlexiWidgetDefaults<TClass> & {
	/**
	 * A stable identifier for this widget, used for persistence and layout
	 * import/export. Read when the widget is created.
	 */
	id?: string;

	/**
	 * The registry key used when creating this widget. Changing the prop does not recreate it.
	 */
	type?: string;

	/**
	 * The starting column (x-coordinate) of the widget. After creation, use moveTo() to move it.
	 */
	x?: number;

	/**
	 * The starting row (y-coordinate) of the widget. After creation, use moveTo() to move it.
	 */
	y?: number;

	/**
	 * The initial width of the widget in grid units. Changing the prop does not resize an existing widget.
	 */
	width?: number;

	/**
	 * The initial height of the widget in grid units. Changing the prop does not resize an existing widget.
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

export type FlexiWidgetDerivedConfiguration<TClass = unknown> = {
	/**
	 * The component that is rendered by this item. This is optional if a snippet is provided.
	 */
	component?: FlexiComponent;

	/**
	 * The props applied to the component rendered, if it has one.
	 */
	componentProps?: Record<string, any>;

	/**
	 * The render function used for this widget's content. It takes precedence over
	 * component and receives the widget controller. To wrap the configured
	 * component, render widget.component with widget.componentProps inside this function.
	 */
	snippet?: FlexiWidgetChildrenSnippet;

	/**
	 * The resizability of the widget.
	 * @default none
	 */
	resizability: WidgetResizability;

	/**
	 * Whether the widget can move at all: `draggability` is not `'none'`. Read-only; set `draggability`.
	 */
	readonly draggable: boolean;

	/**
	 * The draggability of the widget.
	 * @default full
	 */
	draggability: WidgetDraggability;

	/**
	 * The class name that is applied to this widget.
	 */
	className?: FlexiWidgetClasses<TClass>;

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

export type FlexiWidgetConstructorParams<TClass = unknown> = {
	config: FlexiWidgetConfiguration<TClass>;
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
