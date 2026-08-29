import { createSubscriber } from 'svelte/reactivity';
import { effect } from '@flexiboards/core';

/**
 * Wraps a read of core signal-backed state so that Svelte effects/templates
 * reading it re-run when the underlying core signal changes.
 *
 * The `read` function must actually read the reactive value (call signals,
 * touch getters) — tracking happens at read time, not at reference time.
 */
export function fromCore<T>(read: () => T): () => T {
	const subscribe = createSubscriber((update) => {
		const stop = effect(() => {
			read();
			update();
		});

		return stop;
	});

	return () => {
		subscribe();
		return read();
	};
}

const proxyCache = new WeakMap<object, object>();

/**
 * Wraps a core controller in a Proxy whose property reads register as Svelte
 * dependencies (via fromCore), preserving the old runes-era contract that
 * controllers handed to consumer code are reactive to read from anywhere.
 *
 * Applied at every consumer-facing boundary: public context getters, snippet
 * parameters, `controller` bindables and `onfirstcreate` arguments. Adapter
 * internals keep using the raw controllers.
 *
 * Shallow: nested objects returned from properties are not wrapped. Methods
 * are bound to the raw controller so private fields keep working; writes are
 * forwarded straight through to the controller's setters.
 */
export function reactive<T extends object>(controller: T): T {
	const cached = proxyCache.get(controller);
	if (cached) {
		return cached as T;
	}

	// Per-property caches so each property gets one stable subscriber/binding.
	const readers = new Map<PropertyKey, () => unknown>();
	const boundFns = new Map<PropertyKey, unknown>();

	const proxy = new Proxy(controller, {
		get(target, prop) {
			const value = Reflect.get(target, prop, target);

			if (typeof value === 'function') {
				let bound = boundFns.get(prop);
				if (!bound) {
					bound = (value as (...args: unknown[]) => unknown).bind(target);
					boundFns.set(prop, bound);
				}
				return bound;
			}

			let read = readers.get(prop);
			if (!read) {
				read = fromCore(() => Reflect.get(target, prop, target));
				readers.set(prop, read);
			}
			return read();
		},
		set(target, prop, value) {
			return Reflect.set(target, prop, value, target);
		}
	});

	proxyCache.set(controller, proxy);
	return proxy as T;
}

const objectPrototype = Object.prototype;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === objectPrototype || proto === null;
}

/**
 * Deep-reads and shallow-clones the plain-object/array parts of a config value.
 *
 * Adapter prop seams push config into core from inside an `$effect`. Core compares
 * against the config it last stored and memoises on core signals, so two things
 * defeat an in-place mutation of a `$state` config (`config.widgetDefaults.transition = …`):
 *
 * - The effect only tracked the top-level `config` read, so it never re-runs.
 *   Walking every nested property here registers each one as a dependency.
 * - Core's stored copy shares nested objects with the live proxy, so comparing
 *   "previous" against "next" compares the proxy with itself. Cloning the plain
 *   objects and arrays gives core an independent snapshot to compare against.
 *
 * Functions, class instances, Maps, etc. (snippets, components, adapters, registries)
 * are passed through by reference — they're identity-compared, never walked. This is
 * `$state.snapshot` without the uncloneable-value warnings.
 */
export function snapshotConfig<T>(value: T): T {
	return snapshotValue(value, new Map()) as T;
}

function snapshotValue(value: unknown, seen: Map<object, unknown>): unknown {
	if (Array.isArray(value)) {
		const cached = seen.get(value);
		if (cached) {
			return cached;
		}
		const copy: unknown[] = [];
		seen.set(value, copy);
		for (const item of value) {
			copy.push(snapshotValue(item, seen));
		}
		return copy;
	}

	if (isPlainObject(value)) {
		const cached = seen.get(value);
		if (cached) {
			return cached;
		}
		const copy: Record<string, unknown> = {};
		seen.set(value, copy);
		for (const key of Object.keys(value)) {
			copy[key] = snapshotValue(value[key], seen);
		}
		return copy;
	}

	return value;
}
