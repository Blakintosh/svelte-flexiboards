import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import type { FlexiBoardController, FlexiWidgetController } from '@flexiboards/core';
import NestedBoard from './fixtures/nested-board.svelte';

/*
  Regression (the Notes example's nested kanban board): a drop inside a board
  nested in another board's widget flew in from the wrong place, because the
  nested board's release handler ran after the shared portal had already
  returned the element to the grid. Twin of the React suite's test; Svelte
  happened to subscribe the nested board first, so this guards the ordering.
*/

let component: Record<string, any> | undefined;
const originalComputed = window.getComputedStyle;

class MockResizeObserver {
	static instances = new Set<MockResizeObserver>();
	constructor(private cb: ResizeObserverCallback) {}
	observe() {
		MockResizeObserver.instances.add(this);
	}
	unobserve() {}
	disconnect() {
		MockResizeObserver.instances.delete(this);
	}
	static fire() {
		for (const o of MockResizeObserver.instances) o.cb([], o as unknown as ResizeObserver);
	}
}

/** Real geometry for a 3×3 grid of 100px cells at (left, top) — see the React helpers. */
function layoutGrid(grid: HTMLElement, left: number, top: number) {
	const box = (l: number, t: number, w = 100, h = 100) =>
		({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h }) as DOMRect;
	grid.getBoundingClientRect = () => box(left, top, 300, 300);
	for (const cell of Array.from(grid.querySelectorAll<HTMLElement>('[role="cell"]'))) {
		const x = Number(cell.getAttribute('aria-colindex'));
		const y = Number(cell.getAttribute('aria-rowindex'));
		cell.getBoundingClientRect = () => box(left + x * 100, top + y * 100);
	}
	window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
		const style = originalComputed.call(window, el, pseudo);
		if (el !== grid) return style;
		const tracks: Record<string, string> = {
			'grid-template-columns': '100px 100px 100px',
			'grid-template-rows': '100px 100px 100px',
			'grid-column-gap': '0px',
			'grid-row-gap': '0px'
		};
		return new Proxy(style, {
			get(t, k) {
				if (k === 'getPropertyValue') return (name: string) => tracks[name] ?? t.getPropertyValue(name);
				const v = Reflect.get(t, k);
				return typeof v === 'function' ? v.bind(t) : v;
			}
		});
	}) as typeof window.getComputedStyle;
	MockResizeObserver.fire();
	flushSync();
}

beforeEach(() => {
	vi.stubGlobal('requestAnimationFrame', () => 0);
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
	if (component) unmount(component);
	component = undefined;
	document.body.innerHTML = '';
	window.getComputedStyle = originalComputed;
	vi.unstubAllGlobals();
});

const box = (left: number, top: number, width = 100, height = 100) =>
	({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

describe('drop inside a nested board', () => {
	it('starts the flight from where the widget was released', () => {
		let card: FlexiWidgetController | undefined;
		let outer: FlexiBoardController | undefined;
		let innerBoard: FlexiBoardController | undefined;
		component = mount(NestedBoard, {
			target: document.body,
			props: { oncard: (w) => (card = w), onouter: (b) => (outer = b), oninner: (b) => (innerBoard = b) }
		});
		flushSync();
		expect(card).toBeDefined();

		const inner = document.querySelector<HTMLElement>('.inner')!;
		const grid = inner.querySelector<HTMLElement>('[role="grid"]')!;
		const el = inner.querySelector<HTMLElement>('[role="cell"]')!;
		document.querySelector<HTMLElement>('.outer')!.getBoundingClientRect = () => box(0, 0, 600, 600);
		inner.getBoundingClientRect = () => box(300, 300, 300, 300);
		layoutGrid(grid, 300, 300);

		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		flushSync();
		const portal = document.getElementById('flexi-portal')!;
		expect(portal.contains(el)).toBe(true);
		// Only the inner widget is in hand; the outer block is not grabbed by the same key press.
		expect(innerBoard!.currentWidgetAction?.action).toBe('grab');
		expect(outer!.currentWidgetAction).toBeNull();
		expect(portal.children.length).toBe(1);

		// In hand over the inner grid's far cell. Back in the grid, the same
		// in-hand absolute style would read somewhere else entirely.
		el.getBoundingClientRect = () => (portal.contains(el) ? box(500, 500) : box(800, 800));
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 550, clientY: 550 }));
		flushSync();

		const flights: { left: number; top: number }[] = [];
		const interpolator = (card as unknown as { interpolator: { interpolateMove: (...a: unknown[]) => void } })
			.interpolator;
		const original = interpolator.interpolateMove.bind(interpolator);
		interpolator.interpolateMove = (dims, from, ...rest) => {
			const b = from as { left: number; top: number };
			flights.push({ left: b.left, top: b.top });
			return original(dims, from, ...rest);
		};

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		flushSync();

		expect(flights[0]).toEqual({ left: 500, top: 500 });
		// And the portal handed the element back for the flight.
		expect(portal.contains(el)).toBe(false);
	});
});
