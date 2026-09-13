import { dragInOnceMounted, widgetEvents, type FlexiWidgetController } from '@flexiboards/core';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { useInternalFlexiAddOrNull } from '../adapters/misc.js';
import {
	FlexiWidgetContext,
	type FlexiWidgetChildren,
	type RenderedFlexiWidgetProps
} from '../adapters/widget.js';
import { forwardEvent, controllerRef } from '../adapters/utils.js';
import { parseStyleString, useFromCore } from '../adapter.js';
import { useReactive } from '../adapters/reactive.js';
import { WidgetTransitionPlaceholder } from './widget-transition-placeholder.js';

/** @internal Renders a widget controller's content and provides its context. */
export function RenderedFlexiWidget({ widget, id }: RenderedFlexiWidgetProps) {
	const adder = useInternalFlexiAddOrNull();

	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const innerRef = useRef<HTMLDivElement | null>(null);

	const draggedIn = useRef(false);
	// widget is a core-owned mutable controller, not React-managed state.
	/* eslint-disable react-hooks/immutability */
	useEffect(() => {
		// Core dispatches the drag-in immediately, but the mount timing is ours.
		// Run it once per widget: StrictMode re-runs this effect, and a second
		// grab would be ignored by the board yet still re-arm the keyboard
		// pointer.
		if (adder && !draggedIn.current) {
			draggedIn.current = true;
			dragInOnceMounted(adder, widget);
		}

		widget.mounted = true;
	}, [adder, widget]);
	/* eslint-enable react-hooks/immutability */

	const orphanSweepTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => {
		// Capture at mount: React nulls the ref callbacks before this cleanup
		// runs on unmount, so the refs can't be read then.
		const wrapper = wrapperRef.current;
		const inner = innerRef.current;

		// A StrictMode fake unmount scheduled a sweep. We are alive, so cancel
		// it. An adder widget is mid-drag from its first mount, so a node
		// outside the wrapper does not imply a real unmount.
		if (orphanSweepTimer.current !== undefined) {
			clearTimeout(orphanSweepTimer.current);
			orphanSweepTimer.current = undefined;
		}

		return () => {
			// React only removes the shield wrapper it owns. If core's portal
			// moved the inner node out and nothing returned it, that node would
			// linger in the portal overlay, so sweep the orphan. The grace
			// period means only a real unmount follows through.
			orphanSweepTimer.current = setTimeout(() => {
				if (inner && inner.parentElement !== wrapper) {
					inner.remove();
				}
			});
		};
	}, []);

	// Event watchers are stateful, so create them once per component instance.
	const [events] = useState(() => widgetEvents(widget));

	// Bridge reads of core's signal-backed state into React's reactivity.
	const publicWidget = useReactive(widget as FlexiWidgetController);
	const styleString = useFromCore(useCallback(() => widget.style, [widget]));
	const draggable = useFromCore(useCallback(() => widget.draggable, [widget]));
	const grabbable = useFromCore(useCallback(() => widget.isGrabbable, [widget]));
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

	// Core stores render types opaquely, so narrow them to React's here.
	const snippet = useFromCore(
		useCallback(() => widget.snippet as FlexiWidgetChildren | undefined, [widget])
	);
	const WidgetComponent = useFromCore(
		useCallback(
			() => widget.component as ComponentType<Record<string, unknown>> | undefined,
			[widget]
		)
	);
	// Read raw, possibly undefined. Defaulting to {} inside the read would build
	// a fresh object per snapshot and break the Object.is comparison.
	const componentProps = useFromCore(
		useCallback(() => widget.componentProps as Record<string, unknown> | undefined, [widget])
	);

	const ariaLabel = isShadow
		? 'Widget action preview'
		: grabbable || resizable
			? 'Interactive widget'
			: 'Static widget';

	return (
		<FlexiWidgetContext.Provider value={widget}>
			{/* Shield node: core's portal re-parents the inner widget element
			    during drags, which React must not see. React unmounts this
			    wrapper, which core never moves, so its strict
			    parent.removeChild always succeeds. display:contents keeps the
			    inner div a direct grid participant. */}
			<div style={{ display: 'contents' }} ref={wrapperRef}>
				<div
					className={derivedClassName}
					style={parseStyleString(styleString)}
					onPointerDown={(e) => forwardEvent(e, events.onpointerdown)}
					onKeyDown={(e) => forwardEvent(e, events.onkeydown)}
					aria-grabbed={draggable && !isShadow ? isGrabbed : undefined}
					aria-label={ariaLabel}
					aria-dropeffect={draggable ? 'move' : undefined}
					data-flexi-widget=""
					id={id}
					aria-hidden={isShadow || undefined}
					role={isShadow ? undefined : isGrabbed ? 'group' : 'gridcell'}
					aria-colindex={isShadow || isGrabbed ? undefined : x + 1}
					aria-rowindex={isShadow || isGrabbed ? undefined : y + 1}
					aria-colspan={isShadow || isGrabbed ? undefined : width}
					aria-rowspan={isShadow || isGrabbed ? undefined : height}
					tabIndex={isShadow ? undefined : grabbable && !hasGrabbers ? 0 : -1}
					ref={(el) => {
						innerRef.current = el;
						if (el) el.inert = isShadow;
						controllerRef(widget)(el);
					}}
				>
					{snippet ? (
						snippet({ widget: publicWidget, ...events })
					) : WidgetComponent ? (
						// Not created during render: a stable component reference the
						// consumer stored in the widget's config, retrieved from core.
						// eslint-disable-next-line react-hooks/static-components
						<WidgetComponent {...(componentProps ?? {})} />
					) : null}
				</div>
			</div>

			{/* This occupies the widget's destination space so the widget can be
			    absolutely positioned while it interpolates there. */}
			{shouldDrawPlaceholder && <WidgetTransitionPlaceholder />}
		</FlexiWidgetContext.Provider>
	);
}
