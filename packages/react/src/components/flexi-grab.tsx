import { widgetGrabberEvents, type FlexiWidgetController } from '@flexiboards/core';
import { useCallback, useState } from 'react';
import { useInternalFlexiWidget, type FlexiWidgetSubProps } from '../adapters/widget.js';
import { forwardEvent, renderChildren, useSingleRef } from '../adapters/utils.js';
import { useFromCore } from '../adapter.js';
import { useReactive } from '../adapters/reactive.js';

/** A grab handle for the surrounding widget: a <button> wired to core's grab events. */
export type FlexiGrabProps = FlexiWidgetSubProps;

export function FlexiGrab({ className, children }: FlexiGrabProps) {
	const widget = useInternalFlexiWidget();

	// A grabber registration is a paired add/remove, which is exactly the
	// create/destroy contract useSingleRef manages.
	useSingleRef(() => {
		widget.addGrabber();
		return { destroy: () => widget.removeGrabber() };
	});

	// Event watchers are stateful — create once per component instance.
	const [events] = useState(() => widgetGrabberEvents(widget));

	const enabled = useFromCore(useCallback(() => widget.isGrabbable && widget.mounted, [widget]));
	const publicWidget = useReactive(widget as FlexiWidgetController);
	// useFromCore: the class function may read signal-backed widget state.
	const derivedClassName = useFromCore(
		useCallback(
			() => (typeof className === 'function' ? className(widget) : className),
			[widget, className]
		)
	);

	return (
		<button
			className={derivedClassName}
			disabled={!enabled}
			style={{ userSelect: 'none', touchAction: 'none', cursor: enabled ? 'grab' : 'not-allowed' }}
			onPointerDown={(e) => forwardEvent(e, events.onpointerdown)}
			onKeyDown={(e) => forwardEvent(e, events.onkeydown)}
		>
			{renderChildren(children, { widget: publicWidget })}
		</button>
	);
}
