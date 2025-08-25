import type { Component } from 'svelte';
import { FlexiControllerBase } from '../base.svelte.js';
import type { FlexiTargetController } from '../target/index.js';
import type { WidgetAction, WidgetResizability } from '../types.js';
import {
	defaultTriggerConfig,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetClasses,
	type FlexiWidgetConfiguration,
	type FlexiWidgetConstructor,
	type FlexiWidgetDefaults,
	type FlexiWidgetDerivedConfiguration
} from './types.js';
import { WidgetMoveInterpolator } from './interpolator.svelte.js';
import type { WidgetState } from './state.svelte.js';

export abstract class FlexiWidgetController {
	/**
	 * The target this widget is under, if any.
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
	isShadow: boolean = $state(false);

	/**
	 * Whether this widget is grabbed.
	 */
	isGrabbed: boolean = $derived(this.currentAction?.action == 'grab');

	/**
	 * Whether this widget is being resized.
	 */
	isResizing: boolean = $derived(this.currentAction?.action == 'resize');

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

	/**
	 * Manages transitions between widget positions and dimensions.
	 */
	#interpolator?: WidgetMoveInterpolator;

	protected stateContainer?: WidgetState;
	protected backingState: WidgetStateData;

	constructor(state: WidgetStateData, ctor: FlexiWidgetConstructor) {
		this.backingState = state;

		this.#rawConfig = ctor.config;

		// TODO: needing to differentiate between target and adder is dumb if it's just for grabbing the board context.

		if (ctor.type == 'target') {
			this.target = ctor.target as FlexiTargetController;
			this.isShadow = ctor.isShadow ?? false;

			this.#interpolator = new WidgetMoveInterpolator(ctor.target.provider, this);
		} else if (ctor.type == 'adder') {
			this.#interpolator = new WidgetMoveInterpolator(ctor.adder.provider, this);

			// this.#initialX = ctor.clientX;
			// this.#initialY = ctor.clientY;
			// this.#initialHeightPx = ctor.heightPx;
			// this.#initialWidthPx = ctor.widthPx;
		}
	}

	// Getters and setters

	/**
	 * When the widget is being grabbed, this contains information that includes its position, size and offset.
	 * When this is null, the widget is not being grabbed.
	 */
	get currentAction() {
		if (this.stateContainer) {
			return this.stateContainer.data.currentAction;
		}
		return this.backingState.currentAction;
	}

	set currentAction(value: WidgetAction | null) {
		this.backingState.currentAction = value;
		if (this.stateContainer) {
			this.stateContainer.data.currentAction = value;
		}
	}

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
	 * The width in units of the widget.
	 */
	get width() {
		if (this.stateContainer) {
			return this.stateContainer.data.width;
		}
		return this.backingState.width;
	}

	/**
	 * The height in units of the widget.
	 */
	get height() {
		if (this.stateContainer) {
			return this.stateContainer.data.height;
		}
		return this.backingState.height;
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
	 * Gets the column (x-coordinate) of the widget. This value is readonly and is managed by the target.
	 */
	get x() {
		if (this.stateContainer) {
			return this.stateContainer.data.x;
		}
		return this.backingState.x;
	}

	/**
	 * Gets the row (y-coordinate) of the widget. This value is readonly and is managed by the target.
	 */
	get y() {
		if (this.stateContainer) {
			return this.stateContainer.data.y;
		}
		return this.backingState.y;
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
	 * Whether the widget should draw a placeholder widget in the DOM.
	 */
	get shouldDrawPlaceholder() {
		return this.#interpolator?.active ?? false;
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
	 * Gets the widget's interpolator for transitions.
	 */
	get interpolator() {
		return this.#interpolator;
	}

	/**
	 * Gets the transition configuration for this widget.
	 */
	get transitionConfig() {
		return this.#config.transition;
	}

	abstract get hasGrabbers(): boolean;
	abstract get hasResizers(): boolean;
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
