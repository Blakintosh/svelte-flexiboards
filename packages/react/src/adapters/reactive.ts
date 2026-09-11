import { effect, ReactiveMap, ReactiveSet } from '@flexiboards/core';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { useClientLayoutEffect } from './utils.js';

// Collection objects keep their identity across mutations. Reading their
// contents here both tracks their signal and snapshots membership/order.
function snapshot(value: unknown): unknown[] {
	if (value instanceof ReactiveMap) return [value, ...Array.from(value).flat()];
	if (value instanceof ReactiveSet) return [value, ...value];
	if (Array.isArray(value)) return [...value];
	return [value];
}

function equal(a: unknown[] | undefined, b: unknown[]): boolean {
	return !!a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Wraps a core controller so any signal-backed getter read during render
 * subscribes the component to it. The React twin of the Svelte adapter's
 * `reactive()` proxy.
 *
 * The hook count stays fixed: the proxy's `get` trap only records keys touched
 * while rendering, and one core `effect` re-reads them and re-renders on
 * change. Reads outside render pass through and subscribe nothing.
 *
 * Tracking is top-level: `widget.metadata.type` subscribes to `metadata`.
 * ReactiveSet/ReactiveMap values also subscribe to collection mutations.
 * Keys stay subscribed across conditional branches to avoid missed updates.
 */
export function useReactive<T extends object>(controller: T): T;
export function useReactive<T extends object>(controller: T | null | undefined): T | undefined;
export function useReactive<T extends object>(controller: T | null | undefined): T | undefined {
	const [, rerender] = useReducer((n: number) => n + 1, 0);
	const tracked = useRef(new Set<PropertyKey>());
	const rendering = useRef(false);
	const bound = useRef(new Map<PropertyKey, unknown>());
	const rendered = useRef(new Map<PropertyKey, unknown[]>());

	// The proxy must know whether a read happens during render (record it) or
	// later (pass it through), hence the render-time ref writes below. They
	// reset in a layout effect and never affect rendered output.
	/* eslint-disable react-hooks/refs */
	rendering.current = true;
	useClientLayoutEffect(() => {
		rendering.current = false;
	});

	// (Re)subscribe only when the tracked set grew during this render.
	const subscribed = useRef<{ size: number; dispose: () => void } | null>(null);
	useEffect(() => {
		if (!controller) return;
		const size = tracked.current.size;
		if (subscribed.current?.size === size) return;
		subscribed.current?.dispose();
		let first = true;
		const dispose = effect(() => {
			let missedUpdate = false;
			for (const key of tracked.current) {
				const current = snapshot(Reflect.get(controller, key, controller));
				if (!equal(rendered.current.get(key), current)) missedUpdate = true;
			}
			// Layout effects (including onfirstcreate) may have changed core
			// after render but before this subscription existed. Reconcile that
			// window instead of unconditionally ignoring the initial notification.
			if (!first || missedUpdate) rerender();
			first = false;
		});
		subscribed.current = { size, dispose };
	});
	useEffect(
		() => () => {
			subscribed.current?.dispose();
			subscribed.current = null;
		},
		[controller]
	);

	return useMemo(() => {
		tracked.current.clear();
		bound.current.clear();
		rendered.current.clear();
		// Allow controllers supplied later via onfirstcreate.
		if (!controller) return undefined;
		return new Proxy(controller, {
			get(target, key) {
				const value = Reflect.get(target, key, target);
				if (typeof value === 'function') {
					let fn = bound.current.get(key);
					if (!fn) {
						fn = (value as (...args: unknown[]) => unknown).bind(target);
						bound.current.set(key, fn);
					}
					return fn;
				}
				if (rendering.current) {
					tracked.current.add(key);
					rendered.current.set(key, snapshot(value));
				}
				return value;
			},
			// Writes go to the controller's own setters, which are core's
			// mutation API.
			set(target, key, value) {
				return Reflect.set(target, key, value, target);
			}
		});
	}, [controller]);
	/* eslint-enable react-hooks/refs */
}
