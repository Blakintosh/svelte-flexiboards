import { effect } from '@flexiboards/core';
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';

/**
 * The React twin of the Svelte adapter's `reactive()` proxy: wraps a core
 * controller so any signal-backed getter read *during render* subscribes the
 * component to it, with no per-property hook in user code.
 *
 * How it stays within the Rules of Hooks: this hook uses a fixed number of
 * hooks itself, and the proxy's `get` trap only *records* keys touched while
 * rendering. A single core `effect` re-reads every recorded key and re-renders
 * on change. Reads outside render (event handlers, class functions core calls
 * on its own) pass straight through and subscribe nothing.
 *
 * Tracking is top-level: `widget.metadata.type` subscribes to `metadata`.
 * Recorded keys are never forgotten, so a key read in one branch stays
 * subscribed — harmless over-subscription rather than a missed update.
 */
export function useReactive<T extends object>(controller: T): T;
export function useReactive<T extends object>(controller: T | null | undefined): T | undefined;
export function useReactive<T extends object>(controller: T | null | undefined): T | undefined {
	const [, rerender] = useReducer((n: number) => n + 1, 0);
	const tracked = useRef(new Set<PropertyKey>());
	const rendering = useRef(false);
	const bound = useRef(new Map<PropertyKey, unknown>());

	// The render-time ref writes/reads below are the mechanism, not a mistake:
	// the proxy must know whether a property read happens during render (to
	// record it) or later (to pass it through). They are reset in a layout
	// effect and never influence rendered output directly.
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
			// The effect body runs once at creation to establish tracking; only
			// later runs mean something changed.
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
		// Accepting a missing controller lets a parent hold one it receives later
		// (via onfirstcreate) in state and read it reactively once it arrives.
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
			// Writes go straight to the controller's own setters (e.g.
			// `widget.resizability = 'horizontal'`), which are core's mutation API.
			set(target, key, value) {
				return Reflect.set(target, key, value, target);
			}
		});
	}, [controller]);
	/* eslint-enable react-hooks/refs */
}
