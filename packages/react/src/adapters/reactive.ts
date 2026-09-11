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
 * ReactiveSet/ReactiveMap values also subscribe to collection mutations.
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
	const rendered = useRef(new Map<PropertyKey, unknown[]>());

	// The render-time ref writes/reads below are the mechanism, not a mistake:
	// the proxy must know whether a property read happens during render (to
	// record it) or later (to pass it through). They are reset in a layout
	// effect and never influence rendered output directly.
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
				if (rendering.current) {
					tracked.current.add(key);
					rendered.current.set(key, snapshot(value));
				}
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
