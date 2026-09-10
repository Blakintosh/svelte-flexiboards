import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import type { FlexiBoardController, FlexiWidgetController } from '@flexiboards/core';
import { layoutGrid, rect, setRect } from '@flexiboards/testing';
import NestedBoard from './fixtures/nested-board.svelte';

/*
  Regression (the Notes example's nested kanban board): a drop inside a board
  nested in another board's widget flew in from the wrong place, because the
  nested board's release handler ran after the shared portal had already
  returned the element to the grid. Twin of the React suite's test; Svelte
  happened to subscribe the nested board first, so this guards the ordering.
*/

let component: Record<string, any> | undefined;
let restoreStyle: (() => void) | undefined;

beforeEach(() => {
	vi.stubGlobal('requestAnimationFrame', () => 0);
});

afterEach(() => {
	if (component) unmount(component);
	component = undefined;
	document.body.innerHTML = '';
	restoreStyle?.();
	vi.unstubAllGlobals();
});

describe('drop inside a nested board', () => {
	it('starts the flight from where the widget was released', () => {
		let card: FlexiWidgetController | undefined;
		let outer: FlexiBoardController | undefined;
		let innerBoard: FlexiBoardController | undefined;
		component = mount(NestedBoard, {
			target: document.body,
			props: {
				oncard: (w) => (card = w),
				onouter: (b) => (outer = b),
				oninner: (b) => (innerBoard = b)
			}
		});
		flushSync();
		expect(card).toBeDefined();

		const inner = document.querySelector<HTMLElement>('.inner')!;
		const grid = inner.querySelector<HTMLElement>('[role="grid"]')!;
		const el = inner.querySelector<HTMLElement>('[role="cell"]')!;
		setRect(document.querySelector<HTMLElement>('.outer')!, { width: 600, height: 600 });
		setRect(inner, { left: 300, top: 300, width: 300, height: 300 });
		restoreStyle = layoutGrid(100, { grid, left: 300, top: 300 });

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
		el.getBoundingClientRect = () =>
			portal.contains(el) ? rect({ left: 500, top: 500 }) : rect({ left: 800, top: 800 });
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 550, clientY: 550 }));
		flushSync();

		const flights: { left: number; top: number }[] = [];
		const interpolator = (
			card as unknown as { interpolator: { interpolateMove: (...a: unknown[]) => void } }
		).interpolator;
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
