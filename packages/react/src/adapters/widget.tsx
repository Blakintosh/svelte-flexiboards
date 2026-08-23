import {
	dragInOnceMounted,
	InternalFlexiWidgetController,
	widgetEvents,
	widgetGrabberEvents,
	widgetResizerEvents,
	type FlexiWidgetConfiguration,
	type FlexiWidgetController} from '@flexiboards/core';
import { useInternalFlexiTarget } from './target.js';
import { useInternalFlexiAddOrNull } from './misc.js';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useOnce, useSingleRef } from './utils.js';

const FlexiWidgetContext = createContext<InternalFlexiWidgetController | null>(null);

export function useFlexiWidgetInit(
	config: FlexiWidgetConfiguration,
	onWidgetCreated?: (widget: FlexiWidgetController) => void
) {
	const target = useInternalFlexiTarget();

    useOnce(() => target.registerWidget(config, onWidgetCreated));
}

export type FlexiWidgetChildren = ( params: {
    widget: FlexiWidgetController, 
    onpointerdown: (event: PointerEvent) => void,
    onkeydown: (event: KeyboardEvent) => void
}) => ReactNode;


export type RenderedFlexiWidgetProps = {
    widget: InternalFlexiWidgetController,
    children?: FlexiWidgetChildren
};

export type FlexiWidgetSubProps = {
    children?: FlexiWidgetChildren
};

export function RenderedFlexiWidget({ widget, children }: RenderedFlexiWidgetProps) {
    const adder = useInternalFlexiAddOrNull();
    useEffect(() => {
        if(adder) {
		    // Core dispatches the drag-in immediately; the mount timing is ours.
            dragInOnceMounted(adder, widget);
        }

		widget.mounted = true;
    }, []);

	const events = widgetEvents(widget);

    return (
        <FlexiWidgetContext.Provider value={widget}>
            {children?.({ widget, ...events })}
        </FlexiWidgetContext.Provider>
    )
}

export function FlexiGrab({ children }: FlexiWidgetSubProps) {
	const widget = useInternalFlexiWidget();

    useSingleRef(() => {
        widget.addGrabber();
        return { destroy: () => widget.removeGrabber()}
    });

	const events = widgetGrabberEvents(widget);

    return children?.({ widget, ...events});
}

export function FlexiResize({ children }: FlexiWidgetSubProps) {
	const widget = useInternalFlexiWidget();

    useSingleRef(() => {
        widget.addResizer();
        return { destroy: () => widget.removeResizer()}
    });

	const events = widgetResizerEvents(widget);

    return children?.({ widget, ...events});
}

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

export function useFlexiWidget() {
	return useInternalFlexiWidget() as FlexiWidgetController;
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
