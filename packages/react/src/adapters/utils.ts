import { useEffect, useRef } from 'react';

/**
 * Holds a single controller instance for the component's lifetime: created
 * lazily on first render, destroyed on unmount. Survives StrictMode's
 * unmount/remount cycle by recreating the instance when the effect re-runs
 * after its cleanup destroyed the previous one.
 * @param create Constructs the instance. Captured from the first mount only.
 * @returns The instance.
 */
export function useSingleRef<T extends { destroy(): void }>(create: () => T): T {
	const singleRef = useRef<T | null>(null);
	singleRef.current ??= create();

	useEffect(() => {
		// In StrictMode, the cleanup below already ran and nulled the ref —
		// recreate so the remounted component gets a live instance.
		const single = (singleRef.current ??= create());
		return () => {
			single.destroy();
			// "destroyed" is representable as null, so the ??= above can tell.
			singleRef.current = null;
		};
		// create is deliberately captured at first mount only; listing it would
		// re-run the effect (and destroy/recreate the controller) every render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Docs-sanctioned lazy-initialization pattern: the ref is written at most
	// once per mount during render, and its identity is stable afterwards.
	// eslint-disable-next-line react-hooks/refs
	return singleRef.current;
}

/**
 * Ref callback that attaches the rendered element to a core controller's `ref`
 * slot — the React equivalent of Svelte's `bind:this={controller.ref}`.
 * Controllers are core-owned mutable state, so writing them is their contract,
 * not a React immutability violation.
 * @param controller The controller to receive the element.
 * @returns A callback for the JSX `ref` attribute.
 */
export function controllerRef<T extends { ref: HTMLElement | null }>(controller: T) {
	return (el: HTMLElement | null) => {
		controller.ref = el;
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
