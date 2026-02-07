import type { Component } from 'svelte';
import { FlexiControllerBase } from '../base.svelte.js';
import type { FlexiTargetController } from '../target/index.js';
import type { WidgetAction, WidgetDraggability, WidgetResizability } from '../types.js';
import {
	defaultTriggerConfig,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetClasses,
	type FlexiWidgetConfiguration,
	type FlexiWidgetConstructorParams,
	type FlexiWidgetDefaults,
	type FlexiWidgetDerivedConfiguration
} from './types.js';

export class FlexiWidgetController {
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
		draggability:
			this.#rawConfig.draggability ??
			this.#targetWidgetDefaults?.draggability ??
			this.#providerWidgetDefaults?.draggability ??
			// This is not pretty but will ensure backwards compatibility with the old `draggable` property.
			(this.#rawConfig.draggable !== undefined ? (this.#rawConfig.draggable ? 'full' : 'none') : undefined) ??
			(this.#targetWidgetDefaults?.draggable !== undefined ? (this.#targetWidgetDefaults?.draggable ? 'full' : 'none') : undefined) ??
			(this.#providerWidgetDefaults?.draggable !== undefined ? (this.#providerWidgetDefaults?.draggable ? 'full' : 'none') : undefined) ??
			'full',
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
			defaultTriggerConfig,
		minWidth:
			this.#rawConfig.minWidth ??
			this.#targetWidgetDefaults?.minWidth ??
			this.#providerWidgetDefaults?.minWidth ??
			1,
		minHeight:
			this.#rawConfig.minHeight ??
			this.#targetWidgetDefaults?.minHeight ??
			this.#providerWidgetDefaults?.minHeight ??
			1,
		maxWidth:
			this.#rawConfig.maxWidth ??
			this.#targetWidgetDefaults?.maxWidth ??
			this.#providerWidgetDefaults?.maxWidth ??
			Infinity,
		maxHeight:
			this.#rawConfig.maxHeight ??
			this.#targetWidgetDefaults?.maxHeight ??
			this.#providerWidgetDefaults?.maxHeight ??
			Infinity,
	});

	// Reactive state properties - single source of truth
	backingState: {
		currentAction: WidgetAction | null;
		width: number;
		height: number;
		x: number;
		y: number;
		isBeingDropped: boolean;
		hasGrabbers: boolean;
		hasResizers: boolean;
	} = $state() as any;

	constructor(state: WidgetStateData, params: FlexiWidgetConstructorParams) {
		// Initialize reactive backing state
		this.backingState = {
			currentAction: state.currentAction,
			width: state.width,
			height: state.height,
			x: state.x,
			y: state.y,
			isBeingDropped: state.isBeingDropped,
			hasGrabbers: state.hasGrabbers,
			hasResizers: state.hasResizers
		};

		this.#rawConfig = params.config;

		if (params.target) {
			this.target = params.target as FlexiTargetController;
			this.isShadow = params.isShadow ?? false;
		}
	}

	// Getters and setters

	/**
	 * When the widget is being grabbed, this contains information that includes its position, size and offset.
	 * When this is null, the widget is not being grabbed.
	 */
	get currentAction() {
		return this.backingState.currentAction;
	}

	set currentAction(value: WidgetAction | null) {
		this.backingState.currentAction = value;
	}

	/**
	 * Whether the widget is draggable.
	 * @deprecated Prefer the use of `draggability` instead for finer control. When `true`, `draggability = 'full'`, when `false`, `draggability = 'none'`.
	 */
	get draggable() {
		return this.#config.draggable;
	}

	set draggable(value: boolean) {
		this.#rawConfig.draggable = value;
	}

	/**
	 * The draggability of the widget.
	 */
	get draggability() {
		return this.#config.draggability;
	}
	
	set draggability(value: WidgetDraggability) {
		this.#rawConfig.draggability = value;
	}

	/**
	 * Whether the widget can be grabbed.
	 */
	get isGrabbable() {
		return this.#config.draggability == 'full';
	}

	/**
	 * Whether the widget can be moved.
	 */
	get isMovable() {
		return this.#config.draggability == 'movable' || this.#config.draggability == 'full';
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
		return this.backingState.width;
	}

	/**
	 * The height in units of the widget.
	 */
	get height() {
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
		return this.backingState.x;
	}

	/**
	 * Gets the row (y-coordinate) of the widget. This value is readonly and is managed by the target.
	 */
	get y() {
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

	/**
	 * Whether the widget has any grabbers attached.
	 */
	get hasGrabbers(): boolean {
		return this.backingState.hasGrabbers;
	}

	/**
	 * Whether the widget has any resizers attached
	 */
	get hasResizers(): boolean {
		return this.backingState.hasResizers;
	}

	/**
	 * Whether the widget is currently being dropped after a drag operation.
	 */
	get isBeingDropped(): boolean {
		return this.backingState.isBeingDropped;
	}

	set isBeingDropped(value: boolean) {
		this.backingState.isBeingDropped = value;
	}

	/**
	 * The minimum width of the widget in units.
	 */
	get minWidth() {
		return this.#config.minWidth;
	}

	/**
	 * The minimum height of the widget in units.
	 */
	get minHeight() {
		return this.#config.minHeight;
	}

	/**
	 * The maximum width of the widget in units.
	 */
	get maxWidth() {
		return this.#config.maxWidth;
	}

	/**
	 * The maximum height of the widget in units.
	 */
	get maxHeight() {
		return this.#config.maxHeight;
	}

	/**
	 * The user-provided stable identifier for this widget, if any.
	 * This is used for persistence and layout import/export.
	 */
	get userProvidedId(): string | undefined {
		return undefined; // Overridden in InternalFlexiWidgetController
	}

	/**
	 * The type of this widget (registry key for looking up configuration).
	 */
	get type(): string | undefined {
		return undefined; // Overridden in InternalFlexiWidgetController
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
