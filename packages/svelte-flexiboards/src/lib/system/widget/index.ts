import { getContext, onDestroy, onMount, setContext } from 'svelte';
import type {
	FlexiWidgetChildrenSnippet,
	FlexiWidgetChildrenSnippetParameters,
	FlexiWidgetConfiguration,
	FlexiWidgetTransitionConfiguration,
	FlexiWidgetTransitionTypeConfiguration,
	FlexiWidgetTriggerConfiguration
} from './types.js';
import type { FlexiWidgetController } from './base.svelte.js';
import type { InternalFlexiWidgetController } from './controller.svelte.js';
import { getInternalFlexitargetCtx } from '../target/index.js';
import { widgetEvents, widgetGrabberEvents, widgetResizerEvents } from './events.js';
import { dragInOnceMounted, hasInternalFlexiaddCtx } from '../misc/adder.svelte.js';

const contextKey = Symbol('flexiwidget');

export function flexiwidget(config: FlexiWidgetConfiguration) {
	const target = getInternalFlexitargetCtx();

	if (!target) {
		throw new Error(
			'A FlexiWidget was instantiated outside of a FlexiTarget context. Ensure that flexiwidget() (or <FlexiWidget>) is called within a <FlexiTarget> component.'
		);
	}

	const widget = target.createWidget(config);

	if (!widget) {
		throw new Error(
			"Failed to create widget. Check that the widget's x and y coordinates do not lead to an unresolvable collision."
		);
	}

	setContext(contextKey, widget);
	return {
		widget
	};
}

export function renderedflexiwidget(widget: InternalFlexiWidgetController) {
	// TODO: There's a weird edge case where this is causing a call stack size exceeded error, when a widget is being dragged in from an adder
	// for the first time. I have no idea why, so this will just suppress the error and cause problems for anyone accessing the context.
	// TODO: figure out why this is happening and fix it.
	try {
		setContext(contextKey, widget);
	} catch (error) {
		// console.warn('Error setting context', error);
	}

	if (hasInternalFlexiaddCtx()) {
		dragInOnceMounted(widget);
	}

	onMount(() => {
		widget.mounted = true;
	});

	const events = widgetEvents(widget);

	return {
		widget,
		...events
	};
}

export function flexigrab() {
	const widget = getInternalFlexiwidgetCtx();
	if (!widget) {
		throw new Error(
			'A FlexiGrab was instantiated outside of a FlexiWidget context. Ensure that flexigrab() (or <FlexiGrab>) is called within a <FlexiWidget> component.'
		);
	}

	widget.addGrabber();

	onDestroy(() => {
		widget.removeGrabber();
	});

	const events = widgetGrabberEvents(widget);

	return { widget, ...events };
}

export function flexiresize() {
	const widget = getInternalFlexiwidgetCtx();
	if (!widget) {
		throw new Error(
			'A FlexiResize was instantiated outside of a FlexiWidget context. Ensure that flexiresize() (or <FlexiResize>) is called within a <FlexiWidget> component.'
		);
	}

	widget.addResizer();

	onDestroy(() => {
		widget.removeResizer();
	});

	const events = widgetResizerEvents(widget);

	return { widget, ...events };
}

export function getInternalFlexiwidgetCtx() {
	const widget = getContext<InternalFlexiWidgetController>(contextKey);

	if (!widget) {
		throw new Error(
			'Attempt to get FlexiWidget context outside of a <FlexiWidget> component. Ensure that getFlexiwidgetCtx() is called within a <FlexiWidget> component.'
		);
	}

	return widget;
}

function getFlexiwidgetCtx() {
	const widget = getContext<FlexiWidgetController>(contextKey);

	if (!widget) {
		throw new Error(
			'Attempt to get FlexiWidget context outside of a <FlexiWidget> component. Ensure that getFlexiwidgetCtx() is called within a <FlexiWidget> component.'
		);
	}

	return widget;
}

export function getFlexiwidgetInterpolatorCtx() {
	const widget = getFlexiwidgetCtx();

	if (!widget.interpolator) {
		throw new Error(
			"Attempt to get a FlexiWidget's interpolator when it is not defined. Ensure that the widget's transitions are enabled and the transition placeholder is only created when the interpolator is defined."
		);
	}

	return widget.interpolator;
}

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

/* Exports to go to root index.ts */
export {
	type FlexiWidgetController,
	simpleTransitionConfig,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetChildrenSnippetParameters,
	type FlexiWidgetConfiguration,
	type FlexiWidgetTransitionConfiguration,
	type FlexiWidgetTransitionTypeConfiguration,
	type FlexiWidgetTriggerConfiguration,
	getFlexiwidgetCtx
};
