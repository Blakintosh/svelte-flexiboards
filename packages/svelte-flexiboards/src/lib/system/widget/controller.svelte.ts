import type { FlexiEventBus } from '../event-bus.js';
import {
	getElementMidpoint,
	getPointerService,
	WidgetPointerEventWatcher,
	type PointerService
} from '../shared/utils.svelte.js';
import type { FlexiTargetController } from '../target.svelte.js';
import type {
	WidgetActionEvent,
	WidgetGrabAction,
	WidgetGrabbedEvent,
	WidgetResizeAction,
	WidgetResizingEvent
} from '../types.js';
import { FlexiWidgetController } from './base.svelte.js';
import { WidgetMoveInterpolator, type WidgetMovementAnimation } from './interpolator.svelte.js';
import type { FlexiWidgetConstructor } from './types.js';

export class InternalFlexiWidgetController extends FlexiWidgetController {
	#pointerService: PointerService = getPointerService();

	isBeingDropped: boolean = $state(false);

	#grabbers: number = $state(0);
	#resizers: number = $state(0);

	#hasGrabbers: boolean = $derived(this.#grabbers > 0);
	#hasResizers: boolean = $derived(this.#resizers > 0);

	get hasGrabbers() {
		return this.#hasGrabbers;
	}

	get hasResizers() {
		return this.#hasResizers;
	}

	// TODO: try make this internal.
	mounted: boolean = $state(false);

	#eventBus: FlexiEventBus;

	#grabPointerEventWatcher: WidgetPointerEventWatcher = $state(
		new WidgetPointerEventWatcher(this, 'grab')
	);
	#resizePointerEventWatcher: WidgetPointerEventWatcher = $state(
		new WidgetPointerEventWatcher(this, 'resize')
	);

	#initialX: number | null = null;
	#initialY: number | null = null;
	#initialHeightPx: number | null = null;
	#initialWidthPx: number | null = null;

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
		// TODO: need a provision to handle when interpolator is initialised from a dragged in widget, as it doesn't seem to exist
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
		const unitSizeY = action.heightPx / action.initialHeightUnits;
		// Guard against division by zero if initial width is somehow 0
		const unitSizeX = action.initialWidthUnits > 0 ? action.widthPx / action.initialWidthUnits : 1;

		const deltaX = this.#pointerService.position.x - action.offsetX;
		const deltaY = this.#pointerService.position.y - action.offsetY;

		// For resizing, top and left should remain fixed at their initial positions.
		const top = action.top;
		const left = action.left;

		// Calculate new dimensions based on resizability
		let height = action.heightPx;
		let width = action.widthPx;

		switch (this.resizability) {
			case 'horizontal':
				// NOTE: Use the pre-calculated deltaX here
				width = Math.max(action.widthPx + deltaX, unitSizeX);
				break;
			case 'vertical':
				// NOTE: Use the pre-calculated deltaY here
				height = Math.max(action.heightPx + deltaY, unitSizeY);
				break;
			case 'both':
				// NOTE: Use the pre-calculated deltaX and deltaY here
				height = Math.max(action.heightPx + deltaY, unitSizeY);
				width = Math.max(action.widthPx + deltaX, unitSizeX);
				break;
		}

		// Return the style string for the absolutely positioned widget
		return `pointer-events: none; user-select: none; cursor: nwse-resize; position: absolute; top: ${top}px; left: ${left}px; height: ${height}px; width: ${width}px;`;
	}

	// Constructor for widget creation directly under a FlexiTarget
	constructor(ctor: FlexiWidgetConstructor) {
		// Initialise the state proxy.
		super(
			{
				currentAction: null,
				width: ctor.config.width ?? 1,
				height: ctor.config.height ?? 1,
				x: 0,
				y: 0
			},
			ctor
		);

		this.#eventBus = ctor.eventBus;

		if (ctor.type == 'adder') {
			this.#initialX = ctor.clientX;
			this.#initialY = ctor.clientY;
			this.#initialHeightPx = ctor.heightPx;
			this.#initialWidthPx = ctor.widthPx;
		}

		// Allows the event handlers to be called without binding to the widget instance.
		this.onpointerdown = this.onpointerdown.bind(this);
		this.onkeydown = this.onkeydown.bind(this);
		this.ongrabberpointerdown = this.ongrabberpointerdown.bind(this);
		this.ongrabberkeydown = this.ongrabberkeydown.bind(this);
		this.onresizerpointerdown = this.onresizerpointerdown.bind(this);
		this.onresizerkeydown = this.onresizerkeydown.bind(this);

		this.#eventBus.subscribe('widget:grabbed', this.ongrabbed.bind(this));
	}

	/**
	 * Event handler for when the widget receives a pointerdown event.
	 * @param event The event object.
	 */
	onpointerdown(event: PointerEvent) {
		if (!this.draggable || !event.target || this.#grabbers) {
			return;
		}

		this.#grabPointerEventWatcher.onstartpointerdown(event);
	}

	/**
	 * Event handler for when one of the widget's grabbers receives a pointerdown event.
	 * @param event The event object.
	 */
	ongrabberpointerdown(event: PointerEvent) {
		if (!this.draggable || !event.target) {
			return;
		}

		this.#grabPointerEventWatcher.onstartpointerdown(event);
	}

	/**
	 * Event handler for when the widget receives a keydown event.
	 * @param event The event object.
	 */
	onkeydown(event: KeyboardEvent) {
		if (this.#grabbers) {
			return;
		}

		this.#dispatchKeydownGrabbedEvent(event);
	}

	/**
	 * Event handler for when one of the widget's grabbers receives a keydown event.
	 * @param event The event object.
	 */
	ongrabberkeydown(event: KeyboardEvent) {
		this.#dispatchKeydownGrabbedEvent(event);
	}

	#dispatchKeydownGrabbedEvent(event: KeyboardEvent) {
		if (!this.draggable || !this.ref || event.key !== 'Enter') {
			return;
		}

		// so that the board's listener doesn't interfere
		event.stopPropagation();
		event.preventDefault();

		const { x, y } = getElementMidpoint(event.target as HTMLElement);

		this.#dispatchGrabbedEvent({
			clientX: x,
			clientY: y
		});
	}

	ongrab(event: WidgetActionEvent) {
		this.#grabWidget(event.clientX, event.clientY);
		// Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
		if (!event.isKeyboard) {
			(event.target as HTMLElement).releasePointerCapture(event.pointerId);
		}
	}

	ongrabbed(event: WidgetGrabbedEvent) {
		if (event.widget !== this) {
			return;
		}

		// We probably need to wait for the widget to be portalled before we can acquire its focus.
		setTimeout(() => {
			this.ref?.focus();
		}, 0);

		this.currentAction = {
			action: 'grab',
			widget: this,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			capturedHeightPx: event.capturedHeightPx,
			capturedWidthPx: event.capturedWidthPx
		};
	}

	onresizing(event: WidgetResizingEvent) {
		if (event.widget !== this) {
			return;
		}

		// We probably need to wait for the widget to be portalled before we can acquire its focus.
		setTimeout(() => {
			this.ref?.focus();
		}, 0);

		this.currentAction = {
			action: 'resize',
			widget: this,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			left: event.left,
			top: event.top,
			heightPx: event.heightPx,
			widthPx: event.widthPx,
			initialHeightUnits: event.initialHeightUnits,
			initialWidthUnits: event.initialWidthUnits
		};
	}

	onresize(event: WidgetActionEvent) {
		// Pass the pointer ID and target element to the internal method
		this.#startResizeWidget(event.clientX, event.clientY);

		// Don't implicitly keep the pointer capture, as then mobile can't properly maintain correct focuses.
		if (!event.isKeyboard) {
			(event.target as HTMLElement).releasePointerCapture(event.pointerId);
		}
	}

	initiateFirstDragIn() {
		if (!this.adder) {
			return;
		}

		// Start the widget drag in event
		this.currentAction = this.adder.onstartwidgetdragin({
			widget: this,
			xOffset: 0,
			yOffset: 0,
			clientX: this.#initialX!,
			clientY: this.#initialY!,
			// Pass through the base size of the widget.
			capturedHeight: this.#initialHeightPx!,
			capturedWidth: this.#initialWidthPx!,
			ref: this.ref!
		});
	}

	/**
	 * Event handler for when one of the widget's resizers receives a pointerdown event.
	 * @param event The event object.
	 */
	onresizerpointerdown(event: PointerEvent) {
		if (this.resizability == 'none' || !event.target) {
			return;
		}

		this.#resizePointerEventWatcher.onstartpointerdown(event);
	}

	onresizerkeydown(event: KeyboardEvent) {
		if (this.resizability == 'none' || !event.target) {
			return;
		}

		if (event.key !== 'Enter') {
			return;
		}

		// so that the board's listener doesn't interfere
		event.stopPropagation();
		event.preventDefault();

		const { x, y } = getElementMidpoint(event.target as HTMLElement);
		return this.onresize({
			...event,
			clientX: x,
			clientY: y,
			isKeyboard: true
		});
	}

	#dispatchGrabbedEvent({ clientX, clientY }: { clientX: number; clientY: number }) {
		const rect = this.ref?.getBoundingClientRect();
		if (!rect) {
			return;
		}

		this.#eventBus.dispatch('widget:grabbed', {
			widget: this,
			target: this.target,
			clientX,
			clientY,
			capturedHeightPx: rect.height,
			capturedWidthPx: rect.width,
			xOffset: clientX - rect.left,
			yOffset: clientY - rect.top
		});
	}

	#grabWidget(clientX: number, clientY: number) {
		if (!this.ref) {
			throw new Error('A FlexiWidget was instantiated without a bound reference element.');
		}

		// If the widget is new, then this event shouldn't fire yet.
		if (!this.target) {
			return;
		}

		const rect = this.ref.getBoundingClientRect();

		// Get the offset of the cursor relative to the widget's bounds.
		const xOffset = clientX - rect.left;
		const yOffset = clientY - rect.top;

		// Propagate an event up to the parent target, indicating that the widget has been grabbed.
		this.currentAction = this.target.grabWidget({
			widget: this,
			ref: this.ref,
			xOffset,
			yOffset,
			clientX,
			clientY,
			// Capture the current size of the widget so that we can fix this once it's moving.
			capturedHeight: rect.height,
			capturedWidth: rect.width
		});
	}

	#startResizeWidget(clientX: number, clientY: number) {
		if (!this.ref) {
			throw new Error('A FlexiWidget was instantiated without a bound reference element.');
		}

		// If the widget is new, then this event shouldn't fire yet.
		if (!this.target) {
			return;
		}

		const rect = this.ref.getBoundingClientRect();

		// Propagate an event up to the parent target, indicating that the widget has started resizing.
		this.currentAction = this.target.startResizeWidget({
			widget: this,
			xOffset: clientX,
			yOffset: clientY,
			left: rect.left,
			top: rect.top,
			heightPx: rect.height,
			widthPx: rect.width
		});
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
		if (
			this.state.x == x &&
			this.state.y == y &&
			this.state.width == width &&
			this.state.height == height
		) {
			return;
		}

		this.state.x = x;
		this.state.y = y;
		this.state.width = width;
		this.state.height = height;

		if (interpolate) {
			this.#interpolateMove(x, y, width, height);
		}
	}

	#getMovementAnimation(): WidgetMovementAnimation {
		switch (this.currentAction?.action) {
			case 'grab':
				return 'drop';
			case 'resize':
				return 'drop';
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
		this.isBeingDropped = false;
	}

	/**
	 * Registers a grabber to the widget and returns an object with an `onpointerdown` event handler.
	 * @returns An object with an `onpointerdown` event handler.
	 */
	addGrabber() {
		this.#grabbers++;

		return {
			onpointerdown: this.ongrabberpointerdown,
			onkeydown: this.ongrabberkeydown
		};
	}

	/**
	 * Unregisters a grabber from the widget.
	 */
	removeGrabber() {
		this.#grabbers--;
	}

	/**
	 * Registers a resizer to the widget and returns an object with an `onpointerdown` event handler.
	 * @returns An object with an `onpointerdown` event handler.
	 */
	addResizer() {
		this.#resizers++;

		return {
			onpointerdown: this.onresizerpointerdown,
			onkeydown: this.onresizerkeydown
		};
	}

	/**
	 * Unregisters a resizer from the widget.
	 */
	removeResizer() {
		this.#resizers--;
	}

	/**
	 * Deletes this widget from its target and board.
	 */
	delete() {
		// If the widget hasn't been assigned to a target yet, then we just need to take it off the adder that
		// created it.
		if (this.adder) {
			this.adder.onstopwidgetdragin();
			return;
		}

		// Otherwise it should have a target.
		if (!this.target) {
			throw new Error(
				'A FlexiWidget was deleted without a bound target. This is likely a Flexiboards bug.'
			);
		}

		this.target.deleteWidget(this);
		this.currentAction = null;
	}
}
