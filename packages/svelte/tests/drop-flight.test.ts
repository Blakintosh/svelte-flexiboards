import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import {
	cells,
	dropByKeyboard,
	grabByKeyboard,
	layoutGrid,
	mockFrames,
	pointerMove,
	rect
} from '@flexiboards/testing';
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
let frames: ReturnType<typeof mockFrames>;
let restoreStyle: (() => void) | undefined;
const originalRect = HTMLElement.prototype.getBoundingClientRect;

const isPlaceholder = (el: HTMLElement) =>
	el.style.visibility === 'hidden' && !el.hasAttribute('role');

beforeEach(() => {
	frames = mockFrames();
});

afterEach(() => {
	if (component) unmount(component);
	component = undefined;
	document.body.innerHTML = '';
	HTMLElement.prototype.getBoundingClientRect = originalRect;
	restoreStyle?.();
	frames.restore();
});

describe('drop flight', () => {
	it('flies to the placeholder box measured after the grid has settled', () => {
		component = mount(DropFlightBoard, { target: document.body });
		flushSync();
		restoreStyle = layoutGrid();

		// The placeholder reports a stale slot for as long as it is mounted
		// synchronously with the drop (however many times the adapter reads it),
		// and its real one only once the grid has settled before the next frame.
		let settled = false;
		HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
			if (isPlaceholder(this)) {
				return settled ? rect({ left: 200, top: 200 }) : rect({ left: 0, top: 250 });
			}
			return originalRect.call(this);
		};

		grabByKeyboard(cells()[0]);
		pointerMove(250, 250);
		dropByKeyboard();

		const flying = document.querySelector<HTMLElement>(
			'[role="cell"][style*="position: absolute"]'
		);
		expect(flying).not.toBeNull();

		settled = true;
		frames.flush();
		flushSync();
		frames.flush();
		flushSync();

		expect(flying!.style.top).toBe('200px');
		expect(flying!.style.left).toBe('200px');
	});
});
