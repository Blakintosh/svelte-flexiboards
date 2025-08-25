import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { WidgetAction, WidgetGrabAction, WidgetResizeAction } from '../types.js';
import type { InternalFlexiWidgetController } from './controller.svelte.js';
import type { WidgetMoveInterpolator } from './interpolator.svelte.js';

export class WidgetState {
	data: WidgetStateData = $state() as WidgetStateData;
	interpolator: WidgetMoveInterpolator = $state() as WidgetMoveInterpolator;
	#widget: InternalFlexiWidgetController;

	constructor(widget: InternalFlexiWidgetController, state: WidgetStateData) {
		this.data = state;
		this.#widget = widget;
		// TODO: pass in the board.
		this.interpolator = new WidgetMoveInterpolator(widget.internalTarget?.provider, widget);
	}

	/**
	 * The styling to apply to the widget.
	 */
	style: string = $derived.by(() => {
		const currentAction = this.data.currentAction;

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
			return `grid-column: ${this.data.x + 1} / span ${this.data.width}; grid-row: ${this.data.y + 1} / span ${this.data.height};`;
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

		switch (this.#widget.resizability) {
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
