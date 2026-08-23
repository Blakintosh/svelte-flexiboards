import { useCallback, useEffect, useRef } from 'react';
import { useFlexiWidgetInterpolator } from '../adapters/widget.js';
import { parseStyleString, useFromCore } from '../adapter.js';

/**
 * @internal Rendered by RenderedFlexiWidget while a transition is in flight.
 * Temporarily occupies the widget's destination space so the widget can be
 * absolutely positioned and interpolate to its final destination.
 */
export function WidgetTransitionPlaceholder() {
	const interpolator = useFlexiWidgetInterpolator();

	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (ref.current) {
			interpolator.onPlaceholderMount(ref.current);
		}
	}, [interpolator]);

	// The read must *call* the signal — tracking happens at read time.
	const placeholderStyle = useFromCore(
		useCallback(() => interpolator.placeholderStyle$(), [interpolator])
	);

	return <div style={parseStyleString(placeholderStyle)} ref={ref}></div>;
}
