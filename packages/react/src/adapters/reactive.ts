import { effect } from '@flexiboards/core';
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';

/**
 * Wraps a core controller so any signal-backed getter read during render
 * subscribes the component to it. The React twin of the Svelte adapter's
 * `reactive()` proxy.
 *
 * The hook count stays fixed: the proxy's `get` trap only records keys touched
 * while rendering, and one core `effect` re-reads them and re-renders on
 * change. Reads outside render pass through and subscribe nothing.
 *
 * Tracking is top-level, so `widget.metadata.type` subscribes to `metadata`.
 * Keys stay subscribed across conditional branches to avoid missed updates.
 */
export function useReactive<T extends object>(controller: T): T;
export function useReactive<T extends object>(controller: T | null | undefined): T | undefined;
export function useReactive<T extends object>(controller: T | null | undefined): T | undefined {
	const [, rerender] = useReducer((n: number) => n + 1, 0);
	const tracked = useRef(new Set<PropertyKey>());
	const rendering = useRef(false);
	const bound = useRef(new Map<PropertyKey, unknown>());

	// The proxy must know whether a read happens during render (record it) or
	// later (pass it through), hence the render-time ref writes below. They
	// reset in a layout effect and never affect rendered output.
	/* eslint-disable react-hooks/refs */
	rendering.current = true;
	useLayoutEffect(() => {
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
			for (const key of tracked.current) void Reflect.get(controller, key, controller);
			// The first run only establishes tracking. Later runs mean
			// something changed.
			if (first) first = false;
			else rerender();
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
		// A missing controller is allowed so a parent can hold one it receives
		// later via onfirstcreate and read it reactively once it arrives.
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
				if (rendering.current) tracked.current.add(key);
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
