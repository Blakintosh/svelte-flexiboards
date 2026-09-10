import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { useEffect, useState } from 'react';
import { FlexiBoard, FlexiTarget, FlexiWidget } from '../src/index.js';
import type { FlexiBoardController, FlexiWidgetController } from '../src/index.js';
import {
	cells,
	flushTimers,
	keydown,
	layoutGrid,
	mount,
	pointerMove,
	setRect,
	type Mounted
} from './helpers.js';

/*
  Regression (the Notes example's nested kanban board): a drop inside a board
  nested in another board's widget flew in from the wrong place. The nested
  board is mounted after the outer board's portal has subscribed to the bus,
  so on release the portal returned the element to the grid before the board
  captured its on-screen box — and in the grid the in-hand absolute style
  resolves against the nested board's own containing block. Twin of the
  Svelte suite's test.
*/

let mounted: Mounted | undefined;
let frames: FrameRequestCallback[] = [];

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
	vi.unstubAllGlobals();
});

const free = {
	layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 }
} as const;

let cardController: FlexiWidgetController | undefined;
let outerBoard: FlexiBoardController | undefined;
let innerBoard: FlexiBoardController | undefined;

function Inner() {
	// The nested board appears after the outer board has mounted (content that
	// arrives later, as on the Notes page), so it subscribes to the bus after
	// the outer board's portal has.
	const [ready, setReady] = useState(false);
	useEffect(() => {
		const id = setTimeout(() => setReady(true));
		return () => clearTimeout(id);
	}, []);
	if (!ready) return null;
	return (
		<FlexiBoard
			className="inner"
			onfirstcreate={(b) => (innerBoard = b)}
			config={{
				widgetDefaults: {
					draggability: 'full',
					transition: { drop: { duration: 150, easing: 'ease-out' } }
				}
			}}
		>
			<FlexiTarget keyName="cards" config={free}>
				<FlexiWidget x={0} y={0} width={1} height={1} onfirstcreate={(w) => (cardController = w)}>
					card
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}

describe('drop inside a nested board', () => {
	it('starts the flight from where the widget was released', async () => {
		mounted = mount(
			<FlexiBoard className="outer" onfirstcreate={(b) => (outerBoard = b)}>
				<FlexiTarget keyName="blocks" config={free}>
					<FlexiWidget x={0} y={0} width={3} height={3} component={Inner} />
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		await flushTimers();
		expect(cardController).toBeDefined();

		// The inner board sits inside the outer widget, offset from the viewport
		// origin, and is a 3×3 grid of 100px cells there.
		const inner = document.querySelector<HTMLElement>('.inner')!;
		const grid = inner.querySelector<HTMLElement>('[role="grid"]')!;
		setRect(document.querySelector('.outer')!, { left: 0, top: 0, width: 600, height: 600 });
		layoutGrid(100, { grid, left: 300, top: 300 });
		const card = cells(grid)[0];

		keydown(card, 'Enter');
		const portal = document.getElementById('flexi-portal')!;
		expect(portal.contains(card)).toBe(true);
		// Only the inner widget is in hand: core stopped the keydown, and the
		// adapter must carry that through React's own propagation so the outer
		// block (focusable, no grab handle) is not grabbed by the same key press.
		expect(innerBoard!.currentWidgetAction?.action).toBe('grab');
		expect(outerBoard!.currentWidgetAction).toBeNull();
		expect(portal.children.length).toBe(1);

		// In hand over the inner grid's far cell. Back in the grid, the same
		// in-hand absolute style would read somewhere else entirely.
		const inPortal = () => document.getElementById('flexi-portal')!.contains(card);
		card.getBoundingClientRect = () =>
			(inPortal()
				? { left: 500, top: 500, width: 100, height: 100 }
				: { left: 800, top: 800, width: 100, height: 100 }) as DOMRect;
		pointerMove(550, 550);

		// The flight's starting box is what the widget hands its interpolator.
		const flights: { left: number; top: number }[] = [];
		const interpolator = (
			cardController as unknown as { interpolator: { interpolateMove: (...a: unknown[]) => void } }
		).interpolator;
		const original = interpolator.interpolateMove.bind(interpolator);
		interpolator.interpolateMove = (dims, from, ...rest) => {
			const box = from as { left: number; top: number };
			flights.push({ left: box.left, top: box.top });
			return original(dims, from, ...rest);
		};

		keydown(window, 'Enter');

		// The release box is the in-portal one, not where the element would read
		// once returned to the grid.
		expect(flights[0]).toEqual({ left: 500, top: 500 });
		// And the portal handed the element back for the flight.
		expect(portal.contains(card)).toBe(false);
	});
});
