import type {
	FlexiWidgetChildrenSnippet,
	FlexiWidgetChildrenSnippetParameters,
	FlexiWidgetConfiguration,
	FlexiWidgetTransitionConfiguration,
	FlexiWidgetTransitionTypeConfiguration,
	FlexiWidgetTriggerConfiguration
} from './types.js';
import type { FlexiWidgetController } from './base.js';

// TODO(adapter): removed flexiwidget — registers a widget configuration against the surrounding
// FlexiTarget context (getInternalFlexitargetCtx) when a <FlexiWidget> component is created.
// TODO(adapter): removed renderedflexiwidget — sets the widget context, wires adder drag-in
// (dragInOnceMounted/hasInternalFlexiaddCtx), marks widget.mounted onMount and returns widgetEvents.
// TODO(adapter): removed flexigrab — resolves the widget context, registers a grabber
// (addGrabber/removeGrabber on destroy) and returns widgetGrabberEvents.
// TODO(adapter): removed flexiresize — resolves the widget context, registers a resizer
// (addResizer/removeResizer on destroy) and returns widgetResizerEvents.
// TODO(adapter): removed getInternalFlexiwidgetCtx — retrieves the InternalFlexiWidgetController
// from component context.
// TODO(adapter): removed getFlexiwidgetCtx — retrieves the public FlexiWidgetController from
// component context.
// TODO(adapter): removed getFlexiwidgetInterpolatorCtx — retrieves the context widget's
// interpolator, asserting that it is defined.

/**
 * A helper function to use ease-in-out transitions for move animations, and ease-out for drop animations.
 * @returns The configuration object.
 */
function simpleTransitionConfig(): FlexiWidgetTransitionConfiguration {
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
	simpleTransitionConfig,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetChildrenSnippetParameters,
	type FlexiWidgetConfiguration,
	type FlexiWidgetTransitionConfiguration,
	type FlexiWidgetTransitionTypeConfiguration,
	type FlexiWidgetTriggerConfiguration
};
