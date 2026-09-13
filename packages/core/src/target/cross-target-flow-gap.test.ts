// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';
import { getFlexiEventBus } from '../shared/event-bus.js';
import { getPointerService } from '../shared/utils.js';

/*
  Regression (Notes example kanban): after dragging a card out of one flow
  column into another, the source column kept an empty slot at the top — the
  drop preview it had shown while the pointer was still over it was never
  removed from its grid model, so the remaining cards stayed shifted down.
*/

const rect = (left: number, top: number, width = 200, height = 300) =>
	({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

function column(board: InternalFlexiBoardController, key: string, left: number) {
	const target = board.createTarget(
		{ layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append', columns: 1 } } as any,
		key
	);
	const grid = target.createGrid();
	const el = document.createElement('div');
	document.body.appendChild(el);
	el.getBoundingClientRect = () => rect(left, 0);
	grid.ref = el;
	return { target, grid };
}

describe('dragging a widget out of a flow column', () => {
	it('leaves the source column compacted, with no slot held for the drop preview', () => {
		const board = new InternalFlexiBoardController({ config: {} } as any, null);
		board.ref = document.body;
		const a = column(board, 'a', 0);
		const b = column(board, 'b', 400);

		const first = a.target.createWidget({ width: 1, height: 1 } as any)!;
		const second = a.target.createWidget({ width: 1, height: 1 } as any)!;
		const third = a.target.createWidget({ width: 1, height: 1 } as any)!;
		expect([first.y, second.y, third.y]).toEqual([0, 1, 2]);

		const bus = getFlexiEventBus();
		const pointer = getPointerService();

		// Grab the first card with the pointer over its own column…
		pointer.updatePosition(100, 20);
		bus.dispatch('widget:grabbed', {
			board,
			target: a.target,
			widget: first,
			clientX: 100,
			clientY: 20,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 200,
			capturedHeightPx: 100
		} as any);
		expect(a.target.dropzoneWidget).toBeTruthy();

		// …carry it over to the other column and let go there.
		pointer.updatePosition(500, 20);
		expect(a.target.dropzoneWidget).toBeFalsy();
		expect(b.target.dropzoneWidget).toBeTruthy();
		bus.dispatch('widget:release', { board, target: b.target, widget: first } as any);

		expect(b.target.widgets.has(first)).toBe(true);
		expect(a.target.widgets.has(first)).toBe(false);
		// The remaining cards close the gap the card (and the preview) left.
		expect([second.y, third.y]).toEqual([0, 1]);
	});
});
