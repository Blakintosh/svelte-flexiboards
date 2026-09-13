import type {
	FlexiWidgetChildrenSnippet,
	FlexiWidgetChildrenSnippetParameters,
	FlexiWidgetConfiguration,
	FlexiWidgetTransitionConfiguration,
	FlexiWidgetTransitionTypeConfiguration,
	FlexiWidgetTriggerConfiguration
} from './types.js';
import type { FlexiWidgetController } from './base.js';
import { spring } from './animation.js';

/** Sine in-out reordering, circ-out drops, and ease-out resizing. Durations are in milliseconds. */
function cssTransitionConfig(): FlexiWidgetTransitionConfiguration {
	return {
		move: {
			duration: 150,
			easing: 'var(--ease-flexi-move, cubic-bezier(0.37, 0, 0.63, 1))'
		},
		drop: {
			duration: 200,
			easing: 'var(--ease-flexi-drop, cubic-bezier(0, 0.55, 0.45, 1))'
		},
		resize: {
			duration: 150,
			easing: 'var(--ease-flexi-resize, ease-out)'
		}
	};
}

/**
 * Original 150ms preset: ease-in-out moves and ease-out drops and resizing.
 * @deprecated Use {@link cssTransitionConfig} for new boards. This retains the original easing and timing.
 */
function simpleTransitionConfig(): FlexiWidgetTransitionConfiguration {
	return {
		move: { duration: 150, easing: 'ease-in-out' },
		drop: { duration: 150, easing: 'ease-out' },
		resize: { duration: 150, easing: 'ease-out' }
	};
}

/** Quick reordering, a small bounce on drop, and resizing without overshoot. */
function springTransitionConfig(): FlexiWidgetTransitionConfiguration {
	return {
		move: spring({ duration: 0.2, bounce: 0.05, precision: 0.5 }),
		drop: spring({ duration: 0.24, bounce: 0.18, precision: 0.5 }),
		resize: spring({ duration: 0.18, bounce: 0, precision: 0.5 })
	};
}

export { InternalFlexiWidgetController } from './controller.js';
export * from './types.js';
export * from './events.js';
export * from './triggers.js';
export * from './interpolator.js';
export * from './animation.js';
export * from './interpolation-utils.js';

/* Exports to go to root index.ts */
export {
	type FlexiWidgetController,
	cssTransitionConfig,
	simpleTransitionConfig,
	springTransitionConfig,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetChildrenSnippetParameters,
	type FlexiWidgetConfiguration,
	type FlexiWidgetTransitionConfiguration,
	type FlexiWidgetTransitionTypeConfiguration,
	type FlexiWidgetTriggerConfiguration
};
