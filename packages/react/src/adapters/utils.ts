import { useEffect, useRef } from 'react';

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
