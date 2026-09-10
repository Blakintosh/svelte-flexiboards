import { widgetResizerEvents, type FlexiWidgetController } from '@flexiboards/core';
import { useCallback, useState } from 'react';
import { useInternalFlexiWidget, type FlexiWidgetSubProps } from '../adapters/widget.js';
import { forwardEvent, renderChildren, useSingleRef } from '../adapters/utils.js';
import { useFromCore } from '../adapter.js';
import { useReactive } from '../adapters/reactive.js';

/** A resize handle for the surrounding widget: a <button> wired to core's resize events. */
export type FlexiResizeProps = FlexiWidgetSubProps;

export function FlexiResize({ className, children }: FlexiResizeProps) {
	const widget = useInternalFlexiWidget();

	useSingleRef(() => {
		widget.addResizer();
		return { destroy: () => widget.removeResizer() };
	});

	// Event watchers are stateful — create once per component instance.
	const [events] = useState(() => widgetResizerEvents(widget));
	const publicWidget = useReactive(widget as FlexiWidgetController);
	// useFromCore: the class function may read signal-backed widget state.
	const derivedClassName = useFromCore(
		useCallback(
			() => (typeof className === 'function' ? className(widget) : className),
			[widget, className]
		)
	);

	const enabled = useFromCore(
		useCallback(() => widget.resizability !== 'none' && widget.mounted, [widget])
	);

	return (
		<button
			className={derivedClassName}
			disabled={!enabled}
			style={{ userSelect: 'none', touchAction: 'none', cursor: enabled ? 'nwse-resize' : 'not-allowed' }}
			onPointerDown={(e) => forwardEvent(e, events.onpointerdown)}
			onKeyDown={(e) => forwardEvent(e, events.onkeydown)}
		>
			{renderChildren(children, { widget: publicWidget })}
		</button>
	);
}
