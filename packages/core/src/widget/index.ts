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

/**
 * CSS-transition configuration: ease-in-out for move, ease-out for drop and resize, 150ms each.
 * @returns The configuration object.
 */
function cssTransitionConfig(): FlexiWidgetTransitionConfiguration {
	return {
		move: {
			duration: 150,
			easing: 'ease-in-out'
		},
		drop: {
			duration: 150,
			easing: 'ease-out'
		},
		resize: {
			duration: 150,
			easing: 'ease-out'
		}
	};
}

/**
 * @deprecated Renamed to {@link cssTransitionConfig}; kept as an alias for backwards compatibility.
 */
const simpleTransitionConfig = cssTransitionConfig;

/**
 * A spring-based counterpart to cssTransitionConfig(): a quick, barely-overshooting move, a
 * bouncier drop, and a critically damped resize.
 * @returns The configuration object.
 */
function springTransitionConfig(): FlexiWidgetTransitionConfiguration {
	return {
		move: spring({ duration: 0.3, bounce: 0.1 }),
		drop: spring({ duration: 0.4, bounce: 0.3 }),
		resize: spring({ duration: 0.25, bounce: 0 })
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
