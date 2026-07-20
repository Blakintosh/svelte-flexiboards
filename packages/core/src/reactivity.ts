/**
 * Reactivity façade for Flexiboards core.
 *
 * This is the ONLY module in core that may import from 'alien-signals'.
 * Everything else imports from here, so that the underlying signal library
 * can be swapped (e.g. for TC39 signals) by rewriting this one file.
 */
import {
	computed as alienComputed,
	effect as alienEffect,
	effectScope as alienEffectScope,
	endBatch,
	setActiveSub,
	signal as alienSignal,
	startBatch,
	trigger as alienTrigger
} from 'alien-signals';

/** A writable signal: call with no arguments to read, with one argument to write. */
export type Signal<T> = { (): T; (value: T): void };

/** A read-only signal (e.g. the result of computed()). */
export type ReadonlySignal<T> = () => T;

export const signal = alienSignal;
export const computed = alienComputed;

/**
 * Runs fn immediately and re-runs it whenever a signal it reads changes.
 * fn may return a cleanup function, which runs before each re-run and on stop.
 * Returns a stop function. Effects created outside an effectScope MUST have
 * their stop function retained and called from the owning controller's destroy().
 */
export const effect = alienEffect;

/**
 * Groups effects so they can be stopped together. Returns a stop function.
 * The core equivalent of Svelte's $effect.root.
 */
export const effectScope = alienEffectScope;

/**
 * Manually notifies subscribers of the signals read inside fn. Used after
 * mutating a signal's value in place (arrays, Sets, plain objects) rather
 * than reassigning it.
 */
export const trigger = alienTrigger;

/**
 * Reads signals inside fn without registering them as dependencies of the
 * surrounding effect/computed. The core equivalent of Svelte's untrack.
 */
export function untracked<T>(fn: () => T): T {
	const prev = setActiveSub(undefined);
	try {
		return fn();
	} finally {
		setActiveSub(prev);
	}
}

/**
 * Batches signal writes so effects run once at the end rather than after
 * each write. Use around multi-signal writes at event-handler boundaries.
 */
export function batch<T>(fn: () => T): T {
	startBatch();
	try {
		return fn();
	} finally {
		endBatch();
	}
}
