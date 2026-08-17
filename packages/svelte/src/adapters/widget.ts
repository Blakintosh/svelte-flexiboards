import {
	dragInOnceMounted,
	widgetEvents,
	widgetGrabberEvents,
	widgetResizerEvents,
	type FlexiWidgetConfiguration,
	type FlexiWidgetController,
	type InternalFlexiWidgetController
} from '@flexiboards/core';
import { getContext, onDestroy, onMount, setContext } from 'svelte';
import { getInternalFlexitargetCtx } from './target.js';
import { getInternalFlexiaddCtx, hasInternalFlexiaddCtx } from './misc.js';
import { reactive } from '../adapter.svelte.js';

const contextKey = Symbol('flexiwidget');

export function flexiwidget(
	config: FlexiWidgetConfiguration,
	onWidgetCreated?: (widget: FlexiWidgetController) => void
) {
	const target = getInternalFlexitargetCtx();

	target.registerWidget(config, onWidgetCreated);
}

export function renderedflexiwidget(widget: InternalFlexiWidgetController) {
	setContext(contextKey, widget);

	if (hasInternalFlexiaddCtx()) {
		const adder = getInternalFlexiaddCtx();

		// Core dispatches the drag-in immediately; the mount timing is ours.
		onMount(() => {
			dragInOnceMounted(adder, widget);
		});
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

	widget.addGrabber();

	onDestroy(() => {
		widget.removeGrabber();
	});

	const events = widgetGrabberEvents(widget);

	return { widget, ...events };
}

export function flexiresize() {
	const widget = getInternalFlexiwidgetCtx();

	widget.addResizer();

	onDestroy(() => {
		widget.removeResizer();
	});

	const events = widgetResizerEvents(widget);

	return { widget, ...events };
}

export function getInternalFlexiwidgetCtx() {
	const widget = getContext<InternalFlexiWidgetController | undefined>(contextKey);

	if (!widget) {
		throw new Error(
			'Attempt to get FlexiWidget context outside of a <FlexiWidget> component. Ensure that getFlexiwidgetCtx() is called within a <FlexiWidget> component.'
		);
	}

	return widget;
}

export function getFlexiwidgetCtx() {
	// Consumers read controller state from their own templates/effects, so the
	// public surface must be Svelte-reactive.
	return reactive(getInternalFlexiwidgetCtx() as FlexiWidgetController);
}

export function getFlexiwidgetInterpolatorCtx() {
	const widget = getInternalFlexiwidgetCtx();

	if (!widget.interpolator) {
		throw new Error(
			"Attempt to get a FlexiWidget's interpolator when it is not defined. Ensure that the widget's transitions are enabled and the transition placeholder is only created when the interpolator is defined."
		);
	}

	return widget.interpolator;
}
