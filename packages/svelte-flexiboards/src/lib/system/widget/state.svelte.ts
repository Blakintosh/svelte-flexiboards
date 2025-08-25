import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { WidgetAction, WidgetGrabAction, WidgetResizeAction } from '../types.js';
import type { WidgetStateData } from './base.svelte.js';
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
}
