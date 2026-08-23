/**
 * Helpers for the adapter prop seams (`updateProps` / `updateConfig`).
 *
 * Adapters call these seams from inside their own framework effect, so every
 * seam MUST be a no-op when nothing meaningful changed. An effect that writes
 * unconditionally can be re-entered by the invalidation it caused, which is how
 * prop-sync turns into an infinite loop. Dedupe here is the loop guard, not an
 * optimisation — do not remove it.
 */

/**
 * Shallow equality over own enumerable keys, comparing values with Object.is.
 *
 * Deliberately one level deep: config objects are expected to be *replaced*
 * rather than deep-mutated, which is also what the underlying signal library's
 * identity-based change detection requires.
 */
export function shallowEqual(a: unknown, b: unknown, depth: number = 0): boolean {
	if (Object.is(a, b)) {
		return true;
	}

	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
		return false;
	}

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) {
		return false;
	}

	for (const key of aKeys) {
		if (!Object.prototype.hasOwnProperty.call(b, key)) {
			return false;
		}

		const aValue = (a as Record<string, unknown>)[key];
		const bValue = (b as Record<string, unknown>)[key];

		// Callers pass depth 1 for config objects, whose properties are routinely
		// written as inline literals (`config={{ layout: { ... } }}`) and so get a
		// fresh identity on every render of the consumer. Comparing those by
		// identity would report a change on every render and write on every pass.
		if (depth > 0 ? !shallowEqual(aValue, bValue, depth - 1) : !Object.is(aValue, bValue)) {
			return false;
		}
	}

	return true;
}

/**
 * The own enumerable keys whose values differ between two snapshots.
 *
 * Used by seams that must merge rather than replace, so that state set
 * imperatively on a controller isn't clobbered by an unrelated prop update.
 */
export function changedKeys<T extends object>(previous: T, next: T, depth: number = 0): (keyof T)[] {
	const keys = new Set<keyof T>([
		...(Object.keys(previous) as (keyof T)[]),
		...(Object.keys(next) as (keyof T)[])
	]);

	const changed: (keyof T)[] = [];

	for (const key of keys) {
		if (!shallowEqual(previous[key], next[key], depth)) {
			changed.push(key);
		}
	}

	return changed;
}
