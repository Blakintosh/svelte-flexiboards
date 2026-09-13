import { useCallback, useLayoutEffect, useRef } from 'react';
import { useFlexiWidgetInterpolator } from '../adapters/widget.js';
import { parseStyleString, useFromCore } from '../adapter.js';

/**
 * @internal Rendered by RenderedFlexiWidget while a transition is in flight.
 * Occupies the widget's destination space so the widget can be absolutely
 * positioned and interpolate there.
 */
export function WidgetTransitionPlaceholder() {
	const interpolator = useFlexiWidgetInterpolator();

	const ref = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		if (!ref.current) return;
		// Returns the unmount handler. The interpolator must forget this element
		// once it leaves the grid, or the next flight targets a detached node.
		return interpolator.onPlaceholderMount(ref.current);
	}, [interpolator]);

	// The read must call the signal, since tracking happens at read time.
	const placeholderStyle = useFromCore(
		useCallback(() => interpolator.placeholderStyle$(), [interpolator])
	);

	return <div style={parseStyleString(placeholderStyle)} ref={ref}></div>;
}
