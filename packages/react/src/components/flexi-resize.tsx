import { widgetResizerEvents } from '@flexiboards/core';
import { useState } from 'react';
import { useInternalFlexiWidget, type FlexiWidgetSubProps } from '../adapters/widget.js';
import { useSingleRef } from '../adapters/utils.js';

/** Marks its children as the resize handle for the surrounding widget. */
export function FlexiResize({ children }: FlexiWidgetSubProps) {
	const widget = useInternalFlexiWidget();

	useSingleRef(() => {
		widget.addResizer();
		return { destroy: () => widget.removeResizer() };
	});

	// Event watchers are stateful — create once per component instance.
	const [events] = useState(() => widgetResizerEvents(widget));

	return children?.({ widget, ...events });
}
