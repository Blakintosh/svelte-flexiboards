/**
 * Every helper that dispatches into the board runs through this wrapper. The
 * default runs the work as is, which is right for Svelte (core's effects are
 * synchronous, `flushSync()` settles the DOM). React needs state updates
 * wrapped in `act()` so the render commits before the next assertion:
 *
 *     configure({ flush: act });
 *
 * Pass it once from a setup file.
 */
export type Flush = <T>(work: () => T) => T;

let flush: Flush = (work) => work();

export function configure(options: { flush?: Flush }) {
	if (options.flush) flush = options.flush;
}

/** Runs `work` inside the configured wrapper. */
export const run: Flush = (work) => flush(work);

/**
 * Lets the adapters' grace-period timers fire: React destroys controllers on
 * a macrotask so a StrictMode remount can cancel it. Await this after an
 * unmount before asserting that anything is gone.
 */
export async function flushTimers() {
	await run(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}
