import type { Component } from 'svelte';
import { FlexiControllerBase } from '../base.svelte.js';
import type { FlexiTargetController } from '../target/index.js';
import type { WidgetAction, WidgetResizability } from '../types.js';
import {
	defaultTriggerConfig,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetClasses,
	type FlexiWidgetConfiguration,
	type FlexiWidgetConstructorParams,
	type FlexiWidgetDefaults,
	type FlexiWidgetDerivedConfiguration
} from './types.js';
import { WidgetMoveInterpolator } from './interpolator.svelte.js';


export abstract class FlexiWidgetController {
	/**
	 * The target this widget is under. This is not defined if the widget has not yet been dropped in the board.
	 */
	target?: FlexiTargetController = $state(undefined);

	/**
	 * The DOM element bound to this widget.
	 */
	ref?: HTMLElement = $state(undefined);

	#providerWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.providerWidgetDefaults);
	#targetWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.config.widgetDefaults);
	#rawConfig: FlexiWidgetConfiguration = $state() as FlexiWidgetConfiguration;

	/**
	 * Whether this widget is a shadow dropzone widget.
	 */
	abstract get isShadow(): boolean;

	/**
	 * The reactive configuration of the widget. When these properties are changed, either due to a change in the widget's configuration,
	 * or a change in the target's, or the board's, they will be updated to reflect the new values.
	 */
	#config: FlexiWidgetDerivedConfiguration = $derived({
		component:
			this.#rawConfig.component ??
			this.#targetWidgetDefaults?.component ??
			this.#providerWidgetDefaults?.component,
		componentProps:
			this.#rawConfig.componentProps ??
			this.#targetWidgetDefaults?.componentProps ??
			this.#providerWidgetDefaults?.componentProps,
		snippet:
			this.#rawConfig.snippet ??
			this.#targetWidgetDefaults?.snippet ??
			this.#providerWidgetDefaults?.snippet,
		resizability:
			this.#rawConfig.resizability ??
			this.#targetWidgetDefaults?.resizability ??
			this.#providerWidgetDefaults?.resizability ??
			'none',
		draggable:
			this.#rawConfig.draggable ??
			this.#targetWidgetDefaults?.draggable ??
			this.#providerWidgetDefaults?.draggable ??
			true,
		className:
			this.#rawConfig.className ??
			this.#targetWidgetDefaults?.className ??
			this.#providerWidgetDefaults?.className,
		metadata: this.#rawConfig.metadata,
		transition:
			this.#rawConfig.transition ??
			this.#targetWidgetDefaults?.transition ??
			this.#providerWidgetDefaults?.transition ??
			{}, // Default behaviour: don't animate
		grabTrigger:
			this.#rawConfig.grabTrigger ??
			this.#targetWidgetDefaults?.grabTrigger ??
			this.#providerWidgetDefaults?.grabTrigger ??
			defaultTriggerConfig,
		resizeTrigger:
			this.#rawConfig.resizeTrigger ??
			this.#targetWidgetDefaults?.resizeTrigger ??
			this.#providerWidgetDefaults?.resizeTrigger ??
			defaultTriggerConfig
	});

	// Abstract getters for internal state (implemented by controller)
	abstract get currentAction(): WidgetAction | null;
	abstract get width(): number;
	abstract get height(): number;
	abstract get x(): number;
	abstract get y(): number;
	abstract get isBeingDropped(): boolean;
	abstract get hasGrabbers(): boolean;
	abstract get hasResizers(): boolean;

	/**
	 * Whether this widget is grabbed.
	 */
	abstract get isGrabbed(): boolean;

	/**
	 * Whether this widget is being resized.
	 */
	abstract get isResizing(): boolean;

	constructor(params: FlexiWidgetConstructorParams) {
		this.#rawConfig = params.config;

		if (params.target) {
			this.target = params.target as FlexiTargetController;
		}
	}

	// Getters and setters



	/**
	 * Whether the widget is draggable.
	 */
	get draggable() {
		return this.#config.draggable;
	}

	set draggable(value: boolean) {
		this.#rawConfig.draggable = value;
	}

	/**
	 * The resizability of the widget.
	 */
	get resizability() {
		return this.#config.resizability;
	}

	set resizability(value: WidgetResizability) {
		this.#rawConfig.resizability = value;
	}

	/**
	 * Whether the widget is resizable.
	 */
	get resizable() {
		return this.resizability !== 'none';
	}



	/**
	 * The component that is rendered by this widget.
	 */
	get component() {
		return this.#config.component;
	}

	set component(value: Component | undefined) {
		this.#rawConfig.component = value;
	}

	/**
	 * The props applied to the component rendered, if it has one.
	 */
	get componentProps() {
		return this.#config.componentProps;
	}

	set componentProps(value: Record<string, any> | undefined) {
		this.#rawConfig.componentProps = value;
	}

	/**
	 * The snippet that is rendered by this widget.
	 */
	get snippet() {
		return this.#config.snippet;
	}

	set snippet(value: FlexiWidgetChildrenSnippet | undefined) {
		this.#rawConfig.snippet = value;
	}

	/**
	 * The class name that is applied to this widget.
	 */
	get className() {
		return this.#config.className;
	}

	set className(value: FlexiWidgetClasses | undefined) {
		this.#rawConfig.className = value;
	}



	/**
	 * The metadata associated with this widget, if any.
	 */
	get metadata() {
		return this.#config.metadata;
	}

	set metadata(value: Record<string, any> | undefined) {
		this.#rawConfig.metadata = value;
	}

	/**
	 * Gets the configuration for how pointer events should trigger widget grabs (either on the widget directly
	 * or on a grabber).
	 */
	get grabTrigger() {
		return this.#config.grabTrigger;
	}

	/**
	 * Gets the configuration for how pointer events should trigger widget resizing on a resizer.
	 */
	get resizeTrigger() {
		return this.#config.resizeTrigger;
	}

	/**
	 * Gets the transition configuration for this widget.
	 */
	get transitionConfig() {
		return this.#config.transition;
	}




}

export type WidgetStateData = {
	currentAction: WidgetAction | null;
	width: number;
	height: number;
	x: number;
	y: number;
	isBeingDropped: boolean;
	hasGrabbers: boolean;
	hasResizers: boolean;
};
