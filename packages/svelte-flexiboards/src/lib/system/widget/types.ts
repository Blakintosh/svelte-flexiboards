import type { ClassValue } from 'svelte/elements';

import type { FlexiWidgetController } from './base.svelte.js';
import type { Component, Snippet } from 'svelte';
import {
	immediateTriggerConfig,
	longPressTriggerConfig,
	type PointerTriggerCondition
} from '../shared/utils.svelte.js';
import type { Position, WidgetAction, WidgetResizability } from '../types.js';
import type { FlexiAddController } from '../manage.svelte.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';

export type FlexiWidgetChildrenSnippetParameters = {
	widget: FlexiWidgetController;
};
export type FlexiWidgetChildrenSnippet = Snippet<[FlexiWidgetChildrenSnippetParameters]>;

export type FlexiWidgetClassFunction = (widget: FlexiWidgetController) => ClassValue;
export type FlexiWidgetClasses = ClassValue | FlexiWidgetClassFunction;

export type FlexiWidgetTransitionTypeConfiguration = {
	duration?: number;
	easing?: string;
};

export type FlexiWidgetTransitionConfiguration = {
	move?: FlexiWidgetTransitionTypeConfiguration;
	drop?: FlexiWidgetTransitionTypeConfiguration;
	// resize?: FlexiWidgetTransitionTypeConfiguration;
};

export type FlexiWidgetTriggerConfiguration = Record<string, PointerTriggerCondition>;

export type FlexiWidgetDefaults = {
	/**
	 * Whether the widget is draggable.
	 */
	draggable?: boolean;

	/**
	 * The resizability of the widget.
	 */
	resizability?: WidgetResizability;

	/**
	 * The width of the widget in units.
	 */
	width?: number;

	/**
	 * The height of the widget in units.
	 */
	height?: number;

	/**
	 * The snippet that is rendered by this widget.
	 */
	snippet?: FlexiWidgetChildrenSnippet;

	/**
	 * The component that is rendered by this widget.
	 */
	component?: Component<any, any, any>;

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
};

export type FlexiWidgetConfiguration = FlexiWidgetDefaults & {
	x?: number;
	y?: number;
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
	 * The name of the widget, which can be used to identify it in exported layouts.
	 */
	name?: string;

	/**
	 * The component that is rendered by this item. This is optional if a snippet is provided.
	 */
	component?: Component;

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
	 * Whether the item is draggable.
	 */
	draggable: boolean;

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
};

export type FlexiWidgetUnderAdderConstructor = {
	type: 'adder';
	adder: FlexiAddController;
	widthPx: number;
	heightPx: number;
	clientX: number;
	clientY: number;
};

export type FlexiWidgetUnderTargetConstructor = {
	type: 'target';
	target: InternalFlexiTargetController;
	isShadow?: boolean;
};

export type FlexiWidgetConstructor = (
	| FlexiWidgetUnderAdderConstructor
	| FlexiWidgetUnderTargetConstructor
) & {
	config: FlexiWidgetConfiguration;
};

export const defaultTriggerConfig: FlexiWidgetTriggerConfiguration = {
	default: immediateTriggerConfig(),
	mouse: immediateTriggerConfig(),
	touch: longPressTriggerConfig(),
	pen: longPressTriggerConfig()
};
