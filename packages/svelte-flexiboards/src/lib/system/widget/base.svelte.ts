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
	type FlexiWidgetDerivedConfiguration,
	type FlexiWidgetState
} from './types.js';
import { WidgetMoveInterpolator, type WidgetMovementAnimation } from './interpolator.svelte.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import {
	generateUniqueId,
	getElementMidpoint,
	getPointerService,
	type PointerService
} from '../shared/utils.svelte.js';
import type {
	WidgetActionEvent,
	WidgetDroppedEvent,
	WidgetEvent,
	WidgetGrabAction,
	WidgetGrabbedEvent,
	WidgetResizeAction,
	WidgetResizingEvent
} from '../types.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import { WidgetPointerEventWatcher } from './triggers.svelte.js';
import type { InternalFlexiBoardController } from '../board/controller.svelte.js';


export class FlexiWidgetController {
	#pointerService: PointerService = getPointerService();

	/**
	 * The target this widget is under. This is not defined if the widget has not yet been dropped in the board.
	 */
	target?: FlexiTargetController = $state(undefined);

	internalTarget?: InternalFlexiTargetController = undefined;
	provider: InternalFlexiBoardController;

	/**
	 * The DOM element bound to this widget.
	 */
	ref?: HTMLElement = $state(undefined);

	#providerWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.providerWidgetDefaults);
	#targetWidgetDefaults?: FlexiWidgetDefaults = $derived(this.target?.config.widgetDefaults);
	#rawConfig: FlexiWidgetConfiguration = $state() as FlexiWidgetConfiguration;

	// Movement interpolation
	interpolator: WidgetMoveInterpolator;

	mounted: boolean = $state(false);

	// Grabber and resizer tracking
	#grabbersCount: number = 0;
	#resizersCount: number = 0;

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

	/**
	 * Stores the underlying state of the widget. This differs to the derived config above, because it contains configuration items that
	 * are only written to once when the widget is created. Properties stored in here do not react to changes in the config.
	 */
	protected _state: FlexiWidgetState = $state({
		currentAction: null,
		width: 1,
		height: 1,
		x: 0,
		y: 0,
		isBeingDropped: false,
		hasGrabbers: false,
		hasResizers: false,
		isShadow: false
	});

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
	 * The styling to apply to the widget.
	 */
	style: string = $derived.by(() => {
		const currentAction = this.currentAction;

		if (!currentAction) {
			return this.#getPlacedWidgetStyle() + this.#getCursorStyle();
		}

		// Grab action
		if (currentAction.action == 'grab') {
			return this.#getGrabbedWidgetStyle(currentAction);
		}

		// Resize action
		if (currentAction.action == 'resize') {
			return this.#getResizingWidgetStyle(currentAction);
		}

		return this.#getPlacedWidgetStyle() + this.#getCursorStyle();
	});

	readonly id = generateUniqueId('flexiwidget-');

	/**
	 * Whether this widget is a shadow dropzone widget.
	 */
	isShadow = $derived(this._state.isShadow);

	/**
	 * When the widget is being grabbed, this contains information that includes its position, size and offset.
	 * When this is null, the widget is not being grabbed.
	 */
	currentAction = $derived(this._state.currentAction);

	/**
	 * The width in units of the widget.
	 */
	width = $derived(this._state.width);

	/**
	 * The height in units of the widget.
	 */
	height = $derived(this._state.height);

	/**
	 * Gets the column (x-coordinate) of the widget. This value is readonly and is managed by the target.
	 */
	x = $derived(this._state.x);

	/**
	 * Gets the row (y-coordinate) of the widget. This value is readonly and is managed by the target.
	 */
	y = $derived(this._state.y);

	isBeingDropped = $derived(this._state.isBeingDropped);

	hasGrabbers = $derived(this._state.hasGrabbers);

	hasResizers = $derived(this._state.hasResizers);

	/**
	 * Whether this widget is grabbed.
	 */
	isGrabbed = $derived(this._state.currentAction?.action == 'grab');

	/**
	 * Whether this widget is being resized.
	 */
	isResizing = $derived(this._state.currentAction?.action == 'resize');

	constructor(params: FlexiWidgetConstructorParams) {
		this.#rawConfig = params.config;

		// Initialize state with config values
		this._state.width = params.config.width ?? 1;
		this._state.height = params.config.height ?? 1;

		if (params.target) {
			this.target = params.target as FlexiTargetController;
			this.internalTarget = params.target;
			this._state.isShadow = params.isShadow ?? false;
		}

		this.provider = params.provider;

		// Create the widget's interpolator.
		this.interpolator = new WidgetMoveInterpolator(params.provider, this);

		this.#eventBus = getFlexiEventBus();

		this.#unsubscribers.push(
			this.#eventBus.subscribe('widget:grabbed', this.onGrabbed.bind(this)),
			this.#eventBus.subscribe('widget:resizing', this.onResizing.bind(this)),
			this.#eventBus.subscribe('widget:release', this.onReleased.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.onReleased.bind(this)),
			this.#eventBus.subscribe('widget:delete', this.onDelete.bind(this)),
			this.#eventBus.subscribe('widget:dropped', this.onDropped.bind(this))
		);
	}

	#getCursorStyle() {
		if (!this.mounted) {
			return '';
		}

		if (!this.draggable) {
			return '';
		}

		if (this.isGrabbed) {
			return 'pointer-events: none; user-select: none; cursor: grabbing;';
		}

		if (this.isResizing) {
			return 'pointer-events: none; user-select: none; cursor: nwse-resize;';
		}

		const grabberCount = this.#grabbersCount;
		if (grabberCount == 0) {
			return 'user-select: none; cursor: grab; touch-action: none;';
		}

		return '';
	}

	#getPlacedWidgetStyle() {
		if (!this.interpolator?.active) {
			return `grid-column: ${this.x + 1} / span ${this.width}; grid-row: ${this.y + 1} / span ${this.height};`;
		}

		return this.interpolator.widgetStyle;
	}

	#getGrabbedWidgetStyle(action: WidgetGrabAction) {
		const locationOffsetX = this.#pointerService.position.x - action.offsetX;
		const locationOffsetY = this.#pointerService.position.y - action.offsetY;

		// Fixed when it's a grabbed widget.
		const height = action.capturedHeightPx;
		const width = action.capturedWidthPx;

		return `pointer-events: none; user-select: none; cursor: grabbing; position: absolute; top: ${locationOffsetY}px; left: ${locationOffsetX}px; height: ${height}px; width: ${width}px;`;
	}

	#getResizingWidgetStyle(action: WidgetResizeAction) {
		// Calculate size of one grid unit in pixels
		const unitSizeY = action.capturedHeightPx / action.initialHeightUnits;
		// Guard against division by zero if initial width is somehow 0
		const unitSizeX =
			action.initialWidthUnits > 0 ? action.capturedWidthPx / action.initialWidthUnits : 1;

		const deltaX = this.#pointerService.position.x - action.offsetX - action.left;
		const deltaY = this.#pointerService.position.y - action.offsetY - action.top;

		// For resizing, top and left should remain fixed at their initial positions.
		const top = action.top;
		const left = action.left;

		// Calculate new dimensions based on resizability
		let height = action.capturedHeightPx;
		let width = action.capturedWidthPx;

		switch (this.resizability) {
			case 'horizontal':
				// NOTE: Use the pre-calculated deltaX here
				width = Math.max(action.capturedWidthPx + deltaX, unitSizeX);
				break;
			case 'vertical':
				// NOTE: Use the pre-calculated deltaY here
				height = Math.max(action.capturedHeightPx + deltaY, unitSizeY);
				break;
			case 'both':
				// NOTE: Use the pre-calculated deltaX and deltaY here
				height = Math.max(action.capturedHeightPx + deltaY, unitSizeY);
				width = Math.max(action.capturedWidthPx + deltaX, unitSizeX);
				break;
		}

		// Return the style string for the absolutely positioned widget
		return `pointer-events: none; user-select: none; cursor: nwse-resize; position: absolute; top: ${top}px; left: ${left}px; height: ${height}px; width: ${width}px;`;
	}

	onDropped(event: WidgetDroppedEvent) {
		if (event.widget !== this) {
			return;
		}

		this.internalTarget = event.newTarget;
	}

	onGrabbed(event: WidgetGrabbedEvent) {
		if (event.widget !== this) {
			return;
		}

		// We probably need to wait for the widget to be portalled before we can acquire its focus.
		setTimeout(() => {
			this.ref?.focus();
		}, 0);

		this._state.currentAction = {
			action: 'grab',
			widget: this,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			capturedHeightPx: event.capturedHeightPx,
			capturedWidthPx: event.capturedWidthPx
		};
	}

	onResizing(event: WidgetResizingEvent) {
		if (event.widget !== this) {
			return;
		}

		// We probably need to wait for the widget to be portalled before we can acquire its focus.
		setTimeout(() => {
			this.ref?.focus();
		}, 0);

		this._state.currentAction = {
			action: 'resize',
			widget: this,
			offsetX: event.offsetX,
			offsetY: event.offsetY,
			left: event.left,
			top: event.top,
			capturedHeightPx: event.capturedHeightPx,
			capturedWidthPx: event.capturedWidthPx,
			initialHeightUnits: this.height,
			initialWidthUnits: this.width
		};
	}

	onReleased(event: WidgetEvent) {
		if (event.widget !== this) {
			return;
		}

		this._state.currentAction = null;
	}

	/**
	 * Sets the bounds of the widget.
	 * @internal
	 * @param x The x-coordinate of the widget.
	 * @param y The y-coordinate of the widget.
	 * @param width The width of the widget.
	 * @param height The height of the widget.
	 */
	setBounds(x: number, y: number, width: number, height: number, interpolate: boolean = true) {
		if (this.x == x && this.y == y && this.width == width && this.height == height) {
			return;
		}

		this._state.x = x;
		this._state.y = y;
		this._state.width = width;
		this._state.height = height;

		if (interpolate) {
			this.#interpolateMove(x, y, width, height);
		}
	}

	#getMovementAnimation(): WidgetMovementAnimation {
		switch (this.currentAction?.action) {
			case 'grab':
				return 'drop';
			case 'resize':
				return 'resize';
			default:
				return 'move';
		}
	}

	#interpolateMove(x: number, y: number, width: number, height: number) {
		const rect = this.ref?.getBoundingClientRect();
		if (!rect || !this.interpolator) {
			return;
		}

		this.interpolator.interpolateMove(
			{
				x,
				y,
				width,
				height
			},
			{
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height
			},
			this.#getMovementAnimation()
		);
		this._state.isBeingDropped = false;
	}

	/**
	 * Registers a grabber to the widget.
	 */
	addGrabber() {
		this.#grabbersCount++;
		this._state.hasGrabbers = this.#grabbersCount > 0;
	}

	/**
	 * Unregisters a grabber from the widget.
	 */
	removeGrabber() {
		this.#grabbersCount--;
		this._state.hasGrabbers = this.#grabbersCount > 0;
	}

	/**
	 * Registers a resizer to the widget.
	 */
	addResizer() {
		this.#resizersCount++;
		this._state.hasResizers = this.#resizersCount > 0;
	}

	/**
	 * Unregisters a resizer from the widget.
	 */
	removeResizer() {
		this.#resizersCount--;
		this._state.hasResizers = this.#resizersCount > 0;
	}

	/**
	 * Deletes this widget from its target and board.
	 */
	delete() {
		if (!this.internalTarget) {
			return;
		}

		this.#eventBus.dispatch('widget:delete', {
			board: this.internalTarget!.provider,
			widget: this,
			target: this.internalTarget
		});
	}

	onDelete(event: WidgetEvent) {
		if (event.widget != this) {
			return;
		}

		this._state.currentAction = null;

		// Clean up event subscriptions when widget is deleted
		this.destroy();
	}

	/**
	 * Cleanup method to be called when the widget is destroyed
	 */
	destroy() {
		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];

		// Reset counters
		this.#grabbersCount = 0;
		this.#resizersCount = 0;
	}

	setIsBeingDropped(value: boolean) {
		this._state.isBeingDropped = value;
	}

	/**
	 * Whether the widget should draw a placeholder widget in the DOM.
	 */
	get shouldDrawPlaceholder() {
		return this.interpolator?.active ?? false;
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
