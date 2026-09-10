import {
	InternalFlexiWidgetController,
	type FlexiWidgetConfiguration,
	type FlexiWidgetController
} from '@flexiboards/core';
import { createContext, useContext, type ReactNode } from 'react';
import { useInternalFlexiTarget } from './target.js';
import { useOnce, type FlexiChildren } from './utils.js';
import { useReactive } from './reactive.js';

/** @internal Provided by the RenderedFlexiWidget component; consumed via the hooks below. */
export const FlexiWidgetContext = createContext<InternalFlexiWidgetController | null>(null);

/**
 * Registers a widget configuration with the surrounding FlexiTarget.
 * Registration is an irreversible declaration consumed when the target builds
 * its initial widgets, so it runs exactly once per component instance.
 */
export function useFlexiWidgetInit(
	config: FlexiWidgetConfiguration<string>,
	onWidgetCreated?: (widget: FlexiWidgetController) => void
) {
	const target = useInternalFlexiTarget();

	useOnce(() => target.registerWidget(config, onWidgetCreated));
}

export type FlexiWidgetChildren = (params: {
	widget: FlexiWidgetController;
	onpointerdown: (event: PointerEvent) => void;
	onkeydown: (event: KeyboardEvent) => void;
}) => ReactNode;

export type RenderedFlexiWidgetProps = {
	widget: InternalFlexiWidgetController;
};

/**
 * Props shared by the grab and resize handles. Like the Svelte components,
 * they render a <button> that owns the pointer/keyboard wiring, so children
 * are plain content (or a render function receiving the widget).
 */
export type FlexiWidgetSubProps = {
	/** Classes applied to the rendered button: a string, or a function deriving one from the widget's state. */
	className?: string | ((widget: FlexiWidgetController) => string);
	/** The content of the handle. Plain JSX, or a function receiving the surrounding widget's controller. */
	children?: FlexiChildren<{ widget: FlexiWidgetController }>;
};

export function useInternalFlexiWidgetOrNull() {
	return useContext(FlexiWidgetContext);
}

export function useInternalFlexiWidget() {
	const widget = useInternalFlexiWidgetOrNull();

	if (!widget) {
		throw new Error(
			'Attempt to get FlexiWidget context outside of a <FlexiWidget> component. Ensure that useFlexiWidget() is called within a <FlexiWidget> component.'
		);
	}

	return widget;
}

/** The surrounding widget. Signal-backed getters read during render re-render the component. */
export function useFlexiWidget(): FlexiWidgetController {
	return useReactive(useInternalFlexiWidget() as FlexiWidgetController);
}

export function useFlexiWidgetInterpolator() {
	const widget = useInternalFlexiWidget();

	if (!widget.interpolator) {
		throw new Error(
			"Attempt to get a FlexiWidget's interpolator when it is not defined. Ensure that the widget's transitions are enabled and the transition placeholder is only created when the interpolator is defined."
		);
	}

	return widget.interpolator;
}
