import { dragInOnceMounted, widgetEvents, type FlexiWidgetController } from '@flexiboards/core';
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { useInternalFlexiAddOrNull } from '../adapters/misc.js';
import {
	FlexiWidgetContext,
	type FlexiWidgetChildren,
	type RenderedFlexiWidgetProps
} from '../adapters/widget.js';
import { controllerRef } from '../adapters/utils.js';
import { parseStyleString, useFromCore } from '../adapter.js';
import { WidgetTransitionPlaceholder } from './widget-transition-placeholder.js';

/** @internal Renders a widget controller's content and provides its context. */
export function RenderedFlexiWidget({ widget }: RenderedFlexiWidgetProps) {
	const adder = useInternalFlexiAddOrNull();

	useEffect(() => {
		if (adder) {
			// Core dispatches the drag-in immediately; the mount timing is ours.
			dragInOnceMounted(adder, widget);
		}

		// widget is a core-owned mutable controller, not React-managed state.
		// eslint-disable-next-line react-hooks/immutability
		widget.mounted = true;
	}, [adder, widget]);

	// Event watchers are stateful — create once per component instance.
	const [events] = useState(() => widgetEvents(widget));

	// Bridge reads of core's signal-backed state into React's reactivity.
	const styleString = useFromCore(useCallback(() => widget.style, [widget]));
	const draggable = useFromCore(useCallback(() => widget.draggable, [widget]));
	const resizable = useFromCore(useCallback(() => widget.resizable, [widget]));
	const isShadow = useFromCore(useCallback(() => widget.isShadow, [widget]));
	const isGrabbed = useFromCore(useCallback(() => widget.isGrabbed, [widget]));
	const hasGrabbers = useFromCore(useCallback(() => widget.hasGrabbers, [widget]));
	const x = useFromCore(useCallback(() => widget.x, [widget]));
	const y = useFromCore(useCallback(() => widget.y, [widget]));
	const width = useFromCore(useCallback(() => widget.width, [widget]));
	const height = useFromCore(useCallback(() => widget.height, [widget]));
	const shouldDrawPlaceholder = useFromCore(
		useCallback(() => widget.shouldDrawPlaceholder, [widget])
	);

	const derivedClassName = useFromCore(
		useCallback(() => {
			const cls = widget.className;
			if (typeof cls === 'function') {
				return (cls as (widget: FlexiWidgetController) => string)(widget);
			}

			return cls as string | undefined;
		}, [widget])
	);

	// Core stores render types opaquely (FlexiContent/FlexiComponent) — narrow them to React's here.
	const snippet = useFromCore(
		useCallback(() => widget.snippet as FlexiWidgetChildren | undefined, [widget])
	);
	const WidgetComponent = useFromCore(
		useCallback(() => widget.component as ComponentType<Record<string, unknown>> | undefined, [
			widget
		])
	);
	// Read raw (may be undefined) — defaulting to {} inside the read would build
	// a fresh object per snapshot and break Object.is comparison.
	const componentProps = useFromCore(
		useCallback(() => widget.componentProps as Record<string, unknown> | undefined, [widget])
	);

	const ariaLabel = isShadow
		? 'Widget action preview'
		: draggable && resizable
			? 'Interactive widget'
			: 'Static widget';

	return (
		<FlexiWidgetContext.Provider value={widget}>
			<div
				className={derivedClassName}
				style={parseStyleString(styleString)}
				onPointerDown={(e) => events.onpointerdown(e.nativeEvent)}
				onKeyDown={(e) => events.onkeydown(e.nativeEvent)}
				aria-grabbed={draggable && !isShadow ? isGrabbed : undefined}
				aria-label={ariaLabel}
				aria-dropeffect={draggable ? 'move' : undefined}
				role="cell"
				aria-colindex={x}
				aria-rowindex={y}
				aria-colspan={width}
				aria-rowspan={height}
				tabIndex={draggable && !hasGrabbers ? 0 : undefined}
				ref={controllerRef(widget)}
			>
				{snippet ? (
					snippet({ widget: widget as FlexiWidgetController, ...events })
				) : WidgetComponent ? (
					// Not created during render: a stable component reference the
					// consumer stored in the widget's config, retrieved from core.
					// eslint-disable-next-line react-hooks/static-components
					<WidgetComponent {...(componentProps ?? {})} />
				) : null}
			</div>

			{/* When it exists, this temporarily occupies the widget's destination space,
			    allowing the widget to be absolutely positioned to interpolate to its
			    final destination. */}
			{shouldDrawPlaceholder && <WidgetTransitionPlaceholder />}
		</FlexiWidgetContext.Provider>
	);
}
