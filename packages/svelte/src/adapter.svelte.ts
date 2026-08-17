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
