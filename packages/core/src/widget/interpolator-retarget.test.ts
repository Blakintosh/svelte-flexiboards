import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';

/*
  Regression: a dropped widget's flight aimed at the placeholder's box as
  measured the instant the placeholder mounted. In a flow grid the grid reflows
  right after (the drop preview leaves, siblings shift), so by the time the
  animation was pointed at that box it described where the slot *used* to be —
  the widget flew to the stale slot and snapped to its real one on settle.
*/

const rect = (left: number, top: number, width = 100, height = 50) =>
	({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

let frames: FrameRequestCallback[] = [];
const flushFrame = () => {
	const pending = frames;
	frames = [];
	pending.forEach((cb) => cb(performance.now()));
};

beforeEach(() => {
	frames = [];
	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
		frames.push(cb);
		return frames.length;
	});
	vi.stubGlobal(
		'MutationObserver',
		class {
			observe() {}
			disconnect() {}
		}
	);
	(globalThis as any).document ??= { documentElement: { style: {} } };
});

afterEach(() => {
	vi.unstubAllGlobals();
});

function setup() {
	const board = new InternalFlexiBoardController({ config: {} } as any, null);
	const target = board.createTarget(
		{
			layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 },
			widgetDefaults: { transition: { drop: { duration: 150, easing: 'ease-out' } } }
		} as any,
		'left'
	);
	const grid = target.createGrid();
	// A containing block at the viewport origin, so viewport boxes map 1:1.
	const block = {
		getBoundingClientRect: () => rect(0, 0, 300, 300),
		clientTop: 0,
		clientLeft: 0,
		scrollTop: 0,
		scrollLeft: 0
	};
	grid.ref = {
		getBoundingClientRect: () => rect(0, 0, 300, 300),
		offsetParent: block
	} as any;
	const widget = target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;
	return { widget, interpolator: widget.interpolator };
}

describe('drop flight targeting', () => {
	it('aims at the placeholder box measured at the frame, not the box at mount', () => {
		const { interpolator } = setup();

		interpolator.interpolateMove({ x: 2, y: 2, width: 1, height: 1 }, rect(400, 50), 'drop');
		expect(interpolator.widgetStyle$()).toContain('top: 50px');
		expect(interpolator.widgetStyle$()).toContain('left: 400px');

		// The placeholder mounts while the grid still holds the old layout, then
		// settles into its real slot before the next frame.
		let settled = false;
		const placeholder = {
			getBoundingClientRect: () => (settled ? rect(200, 200) : rect(0, 250))
		} as unknown as HTMLElement;
		interpolator.onPlaceholderMount(placeholder);
		settled = true;
		flushFrame();

		expect(interpolator.widgetStyle$()).toContain('top: 200px');
		expect(interpolator.widgetStyle$()).toContain('left: 200px');
		expect(interpolator.widgetStyle$()).not.toContain('top: 250px');
	});

	it('follows the placeholder when the grid reflows around it mid-flight', () => {
		const { interpolator } = setup();
		interpolator.interpolateMove({ x: 2, y: 2, width: 1, height: 1 }, rect(400, 50), 'drop');

		let box = rect(200, 200);
		const placeholder = { getBoundingClientRect: () => box } as unknown as HTMLElement;
		interpolator.onPlaceholderMount(placeholder);
		flushFrame();
		expect(interpolator.widgetStyle$()).toContain('top: 200px');

		// A sibling's flight ends and its placeholder unmounts: this slot moves up,
		// with no style change on the placeholder itself to observe.
		box = rect(200, 150);
		flushFrame();
		expect(interpolator.widgetStyle$()).toContain('top: 150px');
	});
});
