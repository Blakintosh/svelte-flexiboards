import { widgetGrabberEvents } from '@flexiboards/core';
import { useState } from 'react';
import { useInternalFlexiWidget, type FlexiWidgetSubProps } from '../adapters/widget.js';
import { useSingleRef } from '../adapters/utils.js';

/** Marks its children as the grab handle for the surrounding widget. */
export function FlexiGrab({ children }: FlexiWidgetSubProps) {
	const widget = useInternalFlexiWidget();

	// A grabber registration is a paired add/remove, which is exactly the
	// create/destroy contract useSingleRef manages.
	useSingleRef(() => {
		widget.addGrabber();
		return { destroy: () => widget.removeGrabber() };
	});

	// Event watchers are stateful — create once per component instance.
	const [events] = useState(() => widgetGrabberEvents(widget));

	return children?.({ widget, ...events });
}
