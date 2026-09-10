import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import DropFlightBoard from './fixtures/drop-flight-board.svelte';

/*
  Regression (seen on the Notes example's blocks): a dropped widget's flight
  was aimed at the placeholder's box as measured the instant the placeholder
  mounted. The grid reflows right after — the drop preview leaves, siblings
  settle — so the flight went to where the slot used to be, then snapped.
  This drives a real keyboard drop through the adapter and checks the flight
  targets the placeholder's *settled* box. Twin of the React suite's test.
*/

let component: Record<string, any> | undefined;
let frames: FrameRequestCallback[] = [];
const flushFrame = () => {
	const pending = frames;
	frames = [];
	pending.forEach((cb) => cb(performance.now()));
};

const originalRect = HTMLElement.prototype.getBoundingClientRect;
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

const box = (left: number, top: number, width = 100, height = 100) =>
	({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;

const setRect = (el: Element, r: DOMRect) => {
	(el as HTMLElement).getBoundingClientRect = () => r;
};

const cells = () => Array.from(document.querySelectorAll<HTMLElement>('[role="cell"]'));

/** Real geometry for a 3×3 grid of 100px cells at the viewport origin (see the React helpers). */
function layoutGrid() {
	const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
	setRect(document.querySelector('[role="application"]')!, box(0, 0, 300, 300));
	setRect(grid, box(0, 0, 300, 300));
	for (const cell of cells()) {
		const x = Number(cell.getAttribute('aria-colindex'));
		const y = Number(cell.getAttribute('aria-rowindex'));
		setRect(cell, box(x * 100, y * 100));
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

const isPlaceholder = (el: HTMLElement) =>
	el.style.visibility === 'hidden' && !el.hasAttribute('role');

beforeEach(() => {
	frames = [];
	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
		frames.push(cb);
		return frames.length;
	});
	vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
	if (component) unmount(component);
	component = undefined;
	document.body.innerHTML = '';
	HTMLElement.prototype.getBoundingClientRect = originalRect;
	window.getComputedStyle = originalComputed;
	vi.unstubAllGlobals();
});

describe('drop flight', () => {
	it('flies to the placeholder box measured after the grid has settled', () => {
		component = mount(DropFlightBoard, { target: document.body });
		flushSync();
		layoutGrid();

		// The placeholder reports a stale slot for as long as it is mounted
		// synchronously with the drop (however many times the adapter reads it),
		// and its real one only once the grid has settled before the next frame.
		let settled = false;
		HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
			if (isPlaceholder(this)) {
				return settled ? box(200, 200) : box(0, 250);
			}
			return originalRect.call(this);
		};

		cells()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		flushSync();
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 250, clientY: 250 }));
		flushSync();
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		flushSync();

		const flying = document.querySelector<HTMLElement>('[role="cell"][style*="position: absolute"]');
		expect(flying).not.toBeNull();

		settled = true;
		flushFrame();
		flushSync();
		flushFrame();
		flushSync();

		expect(flying!.style.top).toBe('200px');
		expect(flying!.style.left).toBe('200px');
	});
});
