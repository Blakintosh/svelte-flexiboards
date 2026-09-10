import type { FlexiCommonProps as CoreFlexiCommonProps } from '@flexiboards/core';
import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Props every Flexiboards component accepts. Core's version also carries a
 * `controller` bindable, which has no React equivalent: read the controller
 * from `onfirstcreate` or from the matching context hook instead.
 */
export type FlexiCommonProps<T> = Omit<CoreFlexiCommonProps<T>, 'controller'>;

/**
 * Holds a single controller instance for the component's lifetime: created
 * lazily on first render, destroyed on unmount.
 *
 * Destruction uses a grace period (the Relay/React Query timed-disposal
 * pattern): cleanup schedules the destroy on a timer, and an immediately
 * re-run effect — StrictMode's synchronous unmount/remount simulation —
 * cancels it. This keeps the SAME instance alive across the fake death, so
 * the whole controller graph (factory closures, context values, registration
 * queues, all pointing at this instance) stays coherent. A real unmount has
 * no re-run, so the timer fires and destroys on the next tick.
 * @param create Constructs the instance. Captured from the first mount only.
 * @returns The instance.
 */
export function useSingleRef<T extends { destroy(): void }>(create: () => T): T {
	const slotRef = useRef<{
		instance: T;
		destroyTimer?: ReturnType<typeof setTimeout>;
	} | null>(null);
	slotRef.current ??= { instance: create() };

	useEffect(() => {
		const slot = slotRef.current!;

		// Resurrected before the scheduled destroy fired — cancel it.
		if (slot.destroyTimer !== undefined) {
			clearTimeout(slot.destroyTimer);
			slot.destroyTimer = undefined;
		}

		return () => {
			slot.destroyTimer = setTimeout(() => {
				slot.instance.destroy();
				slotRef.current = null;
			});
		};
	}, []);

	// Docs-sanctioned lazy-initialization pattern: the ref is written at most
	// once per mount during render, and its identity is stable afterwards.
	// eslint-disable-next-line react-hooks/refs
	return slotRef.current.instance;
}

/**
 * Ref callback that attaches the rendered element to a core controller's `ref`
 * slot — the React equivalent of Svelte's `bind:this={controller.ref}`.
 * Controllers are core-owned mutable state, so writing them is their contract,
 * not a React immutability violation.
 *
 * Core ref slots are `HTMLElement | undefined`; React's detach `null` is
 * normalized to `undefined` here.
 * @param controller The controller to receive the element.
 * @returns A callback for the JSX `ref` attribute.
 */
export function controllerRef<T extends { ref: HTMLElement | undefined }>(controller: T) {
	return (el: HTMLElement | null) => {
		controller.ref = el ?? undefined;
	};
}

/**
 * Runs fn exactly once per component instance — never again, even across
 * StrictMode remounts. For irreversible declarations (e.g. registering a
 * widget config with its target), not for managed resources: nothing is
 * undone on unmount. Mirrors Svelte's run-once script-body semantics.
 * @param fn The function to run.
 */
export function useOnce(fn: () => void) {
	const ran = useRef(false);
	// Deliberate render-time guard per the docs' initialization exception: fn
	// must run during the first render (before children mount), exactly once.
	// eslint-disable-next-line react-hooks/refs
	if (!ran.current) {
		ran.current = true;
		fn();
	}
}

/**
 * Runs fn once per component instance, from a layout effect — i.e. after the
 * component (and its children) have committed, before paint, and never again
 * across StrictMode's simulated remount. This is where `onfirstcreate`
 * callbacks fire: unlike a render-time call, the consumer may set React state
 * from inside it (Svelte's init-time equivalent has no such restriction).
 * @param fn The function to run.
 */
export function useOnceCommitted(fn: () => void) {
	const ran = useRef(false);
	useLayoutEffect(() => {
		if (ran.current) return;
		ran.current = true;
		fn();
		// Deliberately once: fn is the consumer's first-create callback.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}

/**
 * Hands a React synthetic event's native event to a core handler, then mirrors
 * what core did to it — `stopPropagation()` / `preventDefault()` on the native
 * event — onto the synthetic one. React dispatches every handler for a native
 * event itself, from the root, so stopping the *native* event alone does not
 * stop React from also running an outer widget's handler: with one board nested
 * in another's widget, Enter on the inner widget would grab the outer one too.
 * @param event The React synthetic event.
 * @param handler The core handler taking the native event.
 */
export function forwardEvent<E extends Event>(
	event: { nativeEvent: E; stopPropagation(): void; preventDefault(): void },
	handler: (native: E) => void
) {
	handler(event.nativeEvent);
	if (event.nativeEvent.cancelBubble) {
		event.stopPropagation();
	}
	if (event.nativeEvent.defaultPrevented) {
		event.preventDefault();
	}
}

/**
 * Children that may be plain content or a render function receiving params —
 * the React stand-in for a Svelte snippet with parameters, where the simple
 * case stays as terse as ordinary JSX.
 */
export type FlexiChildren<P> = ReactNode | ((params: P) => ReactNode);

export function renderChildren<P>(children: FlexiChildren<P> | undefined, params: P): ReactNode {
	return typeof children === 'function' ? children(params) : children;
}
