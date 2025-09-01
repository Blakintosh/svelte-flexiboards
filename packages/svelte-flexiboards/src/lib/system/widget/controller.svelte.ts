import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import {
	generateUniqueId,
	getElementMidpoint,
	getPointerService,
	type PointerService
} from '../shared/utils.svelte.js';
import type {
	WidgetAction,
	WidgetActionEvent,
	WidgetDroppedEvent,
	WidgetEvent,
	WidgetGrabAction,
	WidgetGrabbedEvent,
	WidgetResizeAction,
	WidgetResizingEvent
} from '../types.js';
import { FlexiWidgetController } from './base.svelte.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import { WidgetMoveInterpolator, type WidgetMovementAnimation } from './interpolator.svelte.js';
import { WidgetPointerEventWatcher } from './triggers.svelte.js';
import type { FlexiWidgetConstructorParams } from './types.js';
import type { InternalFlexiBoardController } from '../board/controller.svelte.js';

export class InternalFlexiWidgetController extends FlexiWidgetController {
	#pointerService: PointerService = getPointerService();

	// Grabber and resizer tracking
	#grabbers: number = $state(0);
	#resizers: number = $state(0);

	// Movement interpolation
	interpolator: WidgetMoveInterpolator;

	internalTarget?: InternalFlexiTargetController = undefined;
	provider: InternalFlexiBoardController;

	mounted: boolean = $state(false);

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

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

		if (this.#grabbers == 0) {
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

	constructor(params: FlexiWidgetConstructorParams) {
		// Initialise the state proxy.
		super(
			{
				currentAction: null,
				width: params.config.width ?? 1,
				height: params.config.height ?? 1,
				x: 0,
				y: 0,
				hasGrabbers: false,
				hasResizers: false,
				isBeingDropped: false
			},
			params
		);

		if (params.target) {
			this.internalTarget = params.target;
		}

		this.provider = params.provider;

		// Create the widget's interpolator
		this.interpolator = new WidgetMoveInterpolator(this.provider, this);

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

		this.backingState.currentAction = {
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

		this.backingState.currentAction = {
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

		this.backingState.currentAction = null;
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

		this.backingState.x = x;
		this.backingState.y = y;
		this.backingState.width = width;
		this.backingState.height = height;

		if (interpolate) {
			this.#interpolateMove(x, y, width, height);
		}
	}

	#getMovementAnimation(): WidgetMovementAnimation {
		switch (this.backingState.currentAction?.action) {
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
		this.backingState.isBeingDropped = false;
	}

	/**
	 * Registers a grabber to the widget.
	 */
	addGrabber(): number {
		this.#grabbers++;
		this.backingState.hasGrabbers = this.#grabbers > 0;
		return this.#grabbers;
	}

	/**
	 * Unregisters a grabber from the widget.
	 */
	removeGrabber(): number {
		this.#grabbers--;
		this.backingState.hasGrabbers = this.#grabbers > 0;
		return this.#grabbers;
	}

	/**
	 * Registers a resizer to the widget.
	 */
	addResizer(): number {
		this.#resizers++;
		this.backingState.hasResizers = this.#resizers > 0;
		return this.#resizers;
	}

	/**
	 * Unregisters a resizer from the widget.
	 */
	removeResizer(): number {
		this.#resizers--;
		this.backingState.hasResizers = this.#resizers > 0;
		return this.#resizers;
	}

	/**
	 * Gets the current grabber count
	 */
	get grabberCount(): number {
		return this.#grabbers;
	}

	/**
	 * Gets the current resizer count
	 */
	get resizerCount(): number {
		return this.#resizers;
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

		// // If the widget hasn't been assigned to a target yet, then we just need to take it off the adder that
		// // created it.
		// if (this.adder) {
		// 	this.adder.onstopwidgetdragin();
		// 	return;
		// }

		// // Otherwise it should have a target.
		// if (!this.target) {
		// 	throw new Error(
		// 		'A FlexiWidget was deleted without a bound target. This is likely a Flexiboards bug.'
		// 	);
		// }

		// this.target.deleteWidget(this);
		// this.currentAction = null;
	}

	onDelete(event: WidgetEvent) {
		if (event.widget != this) {
			return;
		}

		this.backingState.currentAction = null;

		// Clean up event subscriptions when widget is deleted
		this.destroy();
	}

	/**
	 * Cleanup method to be called when the widget is destroyed
	 */
	destroy() {
		// Reset counters
		this.#grabbers = 0;
		this.#resizers = 0;

		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}

	/**
	 * Whether the widget should draw a placeholder widget in the DOM.
	 */
	get shouldDrawPlaceholder() {
		return this.interpolator?.active ?? false;
	}
}
