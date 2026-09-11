// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InternalFlexiBoardController } from './controller.js';
import { getFlexiEventBus } from '../shared/event-bus.js';
import { getPointerService } from '../shared/utils.js';

const boards: InternalFlexiBoardController[] = [];
beforeEach(() => {
	vi.spyOn(console, 'error');
});
afterEach(() => {
	boards.splice(0).forEach((board) => board.destroy());
	expect(console.error).not.toHaveBeenCalled();
	vi.restoreAllMocks();
	document.body.innerHTML = '';
});

function gridElement(width: number, columns: string) {
	const element = document.createElement('div');
	element.style.cssText = `display: grid; grid-template-columns: ${columns}; grid-template-rows: 100px 100px 100px;`;
	element.getBoundingClientRect = () => new DOMRect(0, 0, width, 300);
	document.body.appendChild(element);
	return element;
}

describe('grabbing with the pointer outside the target', () => {
	it('lets the target the grab point lands in receive the widget', () => {
		// Regression: the grab moved the pointer before recording the action, so
		// the target:pointerenter that move caused saw no action and the target
		// never got widget:entertarget, no drop preview, and the release was
		// refused. A keyboard grab always jumps the pointer like this.
		const board = new InternalFlexiBoardController({ config: {} } as any, null);
		boards.push(board);
		const target = board.createTarget(
			{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } } as any,
			'left'
		);
		const grid = target.createGrid();
		grid.ref = gridElement(300, '100px 100px 100px');
		const widget = target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;

		getPointerService().updatePosition(-50, -50);
		expect(target.hovered).toBe(false);

		getFlexiEventBus().dispatch('widget:grabbed', {
			board,
			target,
			widget,
			clientX: 50,
			clientY: 50,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 100,
			capturedHeightPx: 100
		} as any);

		expect(target.hovered).toBe(true);
		expect(target.actionWidget?.widget).toBe(widget);
	});

	it('does not let the source target snapshot its grid with the grabbed widget still in it', async () => {
		// Regression: telling the hovered target about the grab *before* the
		// widget's own target had removed the widget made that target (the same
		// one, here) build its drop preview around a grid that still held the
		// widget. Leaving the target restored that snapshot: a phantom row that
		// stayed empty for the rest of the session, the "leftover gap".
		const board = new InternalFlexiBoardController({ config: {} } as any, null);
		boards.push(board);
		const target = board.createTarget(
			{ layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' } } as any,
			'list'
		);
		const grid = target.createGrid();
		grid.ref = gridElement(200, '200px');
		const first = target.createWidget({ width: 1, height: 1 } as any)!;
		const second = target.createWidget({ width: 1, height: 1 } as any)!;
		const third = target.createWidget({ width: 1, height: 1 } as any)!;

		const entries = () =>
			(grid.takeSnapshot() as { widgets: { widget: unknown; y: number }[] }).widgets.map(
				(w) => w.widget
			);

		// The mouse rested outside; the grab lands inside the list at its first row.
		getPointerService().updatePosition(-50, -50);
		getFlexiEventBus().dispatch('widget:grabbed', {
			board,
			target,
			widget: first,
			clientX: 100,
			clientY: 20,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 200,
			capturedHeightPx: 100
		} as any);

		// The grabbed widget is out of the grid (its slot is the preview's now).
		expect(entries()).not.toContain(first);
		expect(target.actionWidget?.widget).toBe(first);

		// Carry it out of the list: the list returns to exactly the other two.
		getPointerService().updatePosition(400, 20);
		expect(entries()).toEqual([second, third]);
		expect([second.y, third.y]).toEqual([0, 1]);

		// And cancelling brings the widget back with no phantom slot left behind.
		getFlexiEventBus().dispatch('widget:cancel', {
			board,
			target: undefined,
			widget: first
		} as any);
		// The board restores the source target's pre-grab snapshot in a microtask.
		await Promise.resolve();
		expect(entries()).toEqual([first, second, third]);
		expect([first.y, second.y, third.y]).toEqual([0, 1, 2]);
	});
});
