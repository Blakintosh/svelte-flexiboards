import {
	assistiveTextStyleObject,
	boardEvents,
	InternalFlexiBoardController,
	markSsrEnvironment,
	type FlexiBoardController,
	type FlexiBoardProps as FlexiBoardPropsPrimitive
} from '@flexiboards/core';
import { useCallback, useEffect, useId, useSyncExternalStore, type ReactNode } from 'react';
import { FlexiBoardContext } from '../adapters/board.js';
import { useInternalResponsiveFlexiBoardOrNull } from '../adapters/responsive.js';
import { controllerRef, useOnceCommitted, useSingleRef, type FlexiCommonProps } from '../adapters/utils.js';
import { parseStyleString, useFromCore } from '../adapter.js';
import { FlexiEventBusProvider } from './flexi-event-bus-provider.js';
import { FlexiAnnouncer } from './flexi-announcer.js';
import { FlexiLayoutLoader } from './flexi-layout-loader.js';
import { FlexiPortal } from './flexi-portal.js';
import { FlexiSuspenseBoundary, type FlexiBoardSuspenseReason } from './flexi-suspense-boundary.js';

export type FlexiBoardProps = Omit<FlexiBoardPropsPrimitive<string>, 'class' | 'controller'> &
	FlexiCommonProps<FlexiBoardController> & {
	/**
	 * The child content of the board, which should contain the inner
	 * FlexiTarget and FlexiWidget components.
	 */
	children?: ReactNode;

	/**
	 * The class names to apply to the board's root element.
	 */
	className?: string;

	/**
	 * Fallback content shown while the board's server-rendered layout is
	 * provisional: a stored layout that hasn't been imported yet, or an
	 * unconfirmed responsive breakpoint guess. Server-rendered alongside the
	 * board and toggled by generated CSS, so it applies from the very first
	 * paint; it unmounts once the layout is confirmed after mount.
	 */
	suspense?: (reason: FlexiBoardSuspenseReason) => ReactNode;
};

export function FlexiBoard({ children, className, config, onfirstcreate, suspense }: FlexiBoardProps) {
	// A board nested under a ResponsiveFlexiBoard registers against it.
	const responsiveParent = useInternalResponsiveFlexiBoardOrNull();

	const board = useSingleRef(() => {
		// Tell core when we're server-rendering, before any controller is
		// constructed: the server never runs effect cleanups, so core must avoid
		// registering this render's controllers against process-level singletons.
		if (typeof window === 'undefined') {
			markSsrEnvironment();
		}

		return new InternalFlexiBoardController({ config }, responsiveParent);
	});

	useOnceCommitted(() => onfirstcreate?.(board as FlexiBoardController));

	// boardEvents attaches window listeners and returns its cleanup.
	useEffect(() => boardEvents(board), [board]);

	// Prop seam — push config changes into core after every render, like the
	// Svelte adapter's effect. No dependency array on purpose: updateProps() is
	// inert unless `config` differs by value (one level deep), so an inline
	// `config={{ ... }}` literal costs a cheap comparison per render, and a
	// config mutated in place is still picked up.
	useEffect(() => {
		board.updateProps({ config });
	});

	const assistiveTextId = useId();

	const styleString = useFromCore(useCallback(() => board.style, [board]));

	// One attribute, reason in the value, so stylesheets need a single hook:
	// `data-flexi-pending="layout"` means the content itself is provisional
	// (veil at every viewport); a breakpoint key means only the breakpoint is
	// unconfirmed. Content-pending wins when both apply; absent otherwise.
	const pending = useFromCore(
		useCallback(() => (board.layoutPending ? 'layout' : (board.breakpointPending ?? undefined)), [board])
	);

	// --- Suspense (framework-managed skeleton) ---------------------------------
	// The fallback must exist in the SSR HTML and through hydration: before JS
	// runs, only CSS can decide whether to show it. The breakpoint case is the
	// subtle one: `breakpointPending` is null on the client from the first
	// render (matchMedia answers immediately), but the server HTML contains the
	// fallback — so until mount we reconstruct the server's reason from the
	// environment-independent assumed breakpoint, keeping the trees identical.
	// false on the server and through hydration, true once mounted — the
	// hydration-safe "has mounted" flag, with no state write in an effect.
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false
	);
	const hasSuspense = !!suspense;
	const suspenseReason = useFromCore(
		useCallback((): FlexiBoardSuspenseReason | null => {
			if (!hasSuspense) return null;
			if (board.layoutPending) return { reason: 'layout' };
			const serverAssumed = board.breakpointPending;
			if (serverAssumed !== null) return { reason: 'breakpoint', assumed: serverAssumed };
			if (!mounted) {
				const assumed = board.ssrAssumedBreakpoint;
				if (assumed !== null) return { reason: 'breakpoint', assumed };
			}
			return null;
		}, [board, hasSuspense, mounted])
	);

	const boardContent = (
		<>
			<span style={assistiveTextStyleObject} id={assistiveTextId}>
				Press Enter to grab or resize widgets. Once grabbed, use Arrow keys to move/resize the
				widget, Enter to confirm the action, or Esc to cancel it.
			</span>
			{children}

			<FlexiAnnouncer provider={board} />
		</>
	);

	return (
		<FlexiEventBusProvider>
			<FlexiBoardContext.Provider value={board}>
				<div
					className={className}
					ref={controllerRef(board)}
					style={parseStyleString(styleString)}
					role="application"
					aria-label="Interactive drag-and-drop interface"
					aria-describedby={assistiveTextId}
					aria-busy={pending ? 'true' : undefined}
					data-flexi-pending={pending}
				>
					{suspense ? (
						<FlexiSuspenseBoundary board={board} reason={suspenseReason} fallback={suspense}>
							{boardContent}
						</FlexiSuspenseBoundary>
					) : (
						boardContent
					)}
				</div>

				{/* Tells the board it can start importing layouts, if needed. */}
				<FlexiLayoutLoader />

				{/* Shared portal for rendering grabbed widgets over the pointer. */}
				<FlexiPortal />
			</FlexiBoardContext.Provider>
		</FlexiEventBusProvider>
	);
}
