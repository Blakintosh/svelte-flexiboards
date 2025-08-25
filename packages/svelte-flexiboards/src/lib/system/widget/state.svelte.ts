import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { WidgetAction, WidgetGrabAction, WidgetResizeAction } from '../types.js';
import type { WidgetStateData } from './base.svelte.js';
import type { InternalFlexiWidgetController } from './controller.svelte.js';
import { WidgetMoveInterpolator } from './interpolator.svelte.js';

/**
 * Reactive state container for FlexiWidgets.
 * Constructed separately from the widget controller, as each state container
 * is bound to the lifecycle of a widget component.
 */
export class WidgetReactiveState {
	// Core state data
	currentAction: WidgetAction | null = $state(null);
	width: number = $state(1);
	height: number = $state(1);
	x: number = $state(0);
	y: number = $state(0);
	isBeingDropped: boolean = $state(false);

	// Grabber and resizer tracking
	#grabbers: number = $state(0);
	#resizers: number = $state(0);

	// Derived reactive properties
	hasGrabbers: boolean = $derived(this.#grabbers > 0);
	hasResizers: boolean = $derived(this.#resizers > 0);

	// Movement interpolation
	interpolator: WidgetMoveInterpolator;

	// Reference to the controller (for callbacks, not state)
	#widget: InternalFlexiWidgetController;

	constructor(widget: InternalFlexiWidgetController, initialState: WidgetStateData) {
		this.#widget = widget;

		// Initialize with backing state values
		this.currentAction = initialState.currentAction;
		this.width = initialState.width;
		this.height = initialState.height;
		this.x = initialState.x;
		this.y = initialState.y;
		this.isBeingDropped = initialState.isBeingDropped;

		// Create the widget's interpolator.
		this.interpolator = new WidgetMoveInterpolator(widget.provider, widget);
	}

	/**
	 * Adds a grabber and returns the current count
	 */
	addGrabber(): number {
		return ++this.#grabbers;
	}

	/**
	 * Removes a grabber and returns the current count
	 */
	removeGrabber(): number {
		return --this.#grabbers;
	}

	/**
	 * Adds a resizer and returns the current count
	 */
	addResizer(): number {
		return ++this.#resizers;
	}

	/**
	 * Removes a resizer and returns the current count
	 */
	removeResizer(): number {
		return --this.#resizers;
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
	 * Syncs this reactive state back to the widget's backing state.
	 */
	syncToBackingState(): void {
		const backing = this.#widget.backingState;

		backing.currentAction = this.currentAction;
		backing.width = this.width;
		backing.height = this.height;
		backing.x = this.x;
		backing.y = this.y;
		backing.isBeingDropped = this.isBeingDropped;
		backing.hasGrabbers = this.hasGrabbers;
		backing.hasResizers = this.hasResizers;
	}

	/**
	 * Clean up resources when state is destroyed
	 */
	destroy(): void {
		// Sync final state back to backing store
		this.syncToBackingState();

		// Reset counters
		this.#grabbers = 0;
		this.#resizers = 0;
	}
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use WidgetReactiveState instead
 */
export const WidgetState = WidgetReactiveState;
