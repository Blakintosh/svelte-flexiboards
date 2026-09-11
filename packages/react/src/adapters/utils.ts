import type { FlexiCommonProps as CoreFlexiCommonProps } from '@flexiboards/core';
import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Props every Flexiboards component accepts. Core's version also carries a
 * `controller` bindable, which has no React equivalent. Read the controller
 * from `onfirstcreate` or the matching context hook instead.
 */
export type FlexiCommonProps<T> = Omit<CoreFlexiCommonProps<T>, 'controller'>;

/**
 * Holds one controller instance for the component's lifetime. Created lazily
 * on first render, destroyed on unmount.
 *
 * Cleanup defers destruction until the next tick. StrictMode's immediate
 * effect re-run cancels it, preserving the instance and all references to it.
 * A real unmount lets the timer destroy the instance.
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

		// Resurrected before the scheduled destroy fired, so cancel it.
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

	// Lazy initialization: the ref is written at most once per mount during
	// render, and its identity is stable afterwards.
	// eslint-disable-next-line react-hooks/refs
	return slotRef.current.instance;
}

/**
 * Ref callback that attaches the rendered element to a core controller's `ref`
 * slot, the React equivalent of Svelte's `bind:this={controller.ref}`.
 * Controllers are core-owned mutable state, so writing them is their contract.
 *
 * Core ref slots are `HTMLElement | undefined`, so React's detach `null` is
 * normalized to `undefined`.
 * @param controller The controller to receive the element.
 * @returns A callback for the JSX `ref` attribute.
 */
export function controllerRef<T extends { ref: HTMLElement | undefined }>(controller: T) {
	return (el: HTMLElement | null) => {
		controller.ref = el ?? undefined;
	};
}

/**
 * Runs fn exactly once per component instance, including across StrictMode
 * remounts. Use it for irreversible declarations such as registering a widget
 * config with its target, not for managed resources: nothing is undone on
 * unmount. Mirrors Svelte's run-once script body.
 * @param fn The function to run.
 */
export function useOnce(fn: () => void) {
	const ran = useRef(false);
	// Render-time guard: fn must run during the first render, before children
	// mount, exactly once.
	// eslint-disable-next-line react-hooks/refs
	if (!ran.current) {
		ran.current = true;
		fn();
	}
}

/**
 * Runs fn once per component instance from a layout effect, after the
 * component and its children have committed and before paint. StrictMode's
 * simulated remount does not run it again. `onfirstcreate` callbacks fire
 * here, so the consumer may set React state from inside them.
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
 * any `stopPropagation()` or `preventDefault()` core called onto the synthetic
 * event. React dispatches handlers itself, from the root, so stopping the
 * native event alone still lets an outer widget's handler run: with a board
 * nested in another board's widget, Enter on the inner widget would grab the
 * outer one too.
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
 * Children that may be plain content or a render function receiving params.
 * The React stand-in for a Svelte snippet with parameters.
 */
export type FlexiChildren<P> = ReactNode | ((params: P) => ReactNode);

export function renderChildren<P>(children: FlexiChildren<P> | undefined, params: P): ReactNode {
	return typeof children === 'function' ? children(params) : children;
}
