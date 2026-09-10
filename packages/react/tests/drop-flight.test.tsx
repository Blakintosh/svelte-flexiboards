import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { FlexiBoard, FlexiTarget, FlexiWidget } from '../src/index.js';
import {
	cells,
	flushTimers,
	keydown,
	layoutGrid,
	mount,
	pointerMove,
	type Mounted
} from './helpers.js';

/*
  Regression (seen on the Notes example's blocks): a dropped widget's flight
  was aimed at the placeholder's box as measured the instant the placeholder
  mounted. The grid reflows right after — the drop preview leaves, siblings
  settle — so the flight went to where the slot used to be, then snapped.
  This drives a real keyboard drop through the adapter and checks the flight
  targets the placeholder's *settled* box.
*/

let mounted: Mounted | undefined;
let frames: FrameRequestCallback[] = [];
const flushFrame = () => {
	const pending = frames;
	frames = [];
	pending.forEach((cb) => cb(performance.now()));
};

const originalRect = HTMLElement.prototype.getBoundingClientRect;

beforeEach(() => {
	frames = [];
	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
		frames.push(cb);
		return frames.length;
	});
});

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	document.body.innerHTML = '';
	HTMLElement.prototype.getBoundingClientRect = originalRect;
	vi.unstubAllGlobals();
});

const box = (left: number, top: number, width = 100, height = 100) =>
	({
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
		x: left,
		y: top
	}) as DOMRect;

const isPlaceholder = (el: HTMLElement) =>
	el.style.visibility === 'hidden' && !el.hasAttribute('role');

describe('drop flight', () => {
	it('flies to the placeholder box measured after the grid has settled', () => {
		mounted = mount(
			<FlexiBoard
				config={{
					widgetDefaults: {
						draggability: 'full',
						transition: { drop: { duration: 150, easing: 'ease-out' } }
					}
				}}
			>
				<FlexiTarget
					keyName="left"
					config={{
						layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 }
					}}
				>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						a
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
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

		keydown(cells()[0], 'Enter');
		pointerMove(250, 250);
		keydown(window, 'Enter');

		const flying = document.querySelector<HTMLElement>(
			'[role="cell"][style*="position: absolute"]'
		);
		expect(flying).not.toBeNull();
		expect(document.querySelectorAll('[role="grid"] > div').length).toBeGreaterThan(1);

		settled = true;
		// Frames run outside React's act(), so wrap them to flush the re-render.
		act(() => flushFrame());
		act(() => flushFrame());

		expect(flying!.style.top).toBe('200px');
		expect(flying!.style.left).toBe('200px');
	});
});
