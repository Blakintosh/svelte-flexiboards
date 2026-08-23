import { describe, it, expect, beforeAll } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';
import { getFlexiEventBus } from '../shared/event-bus.js';

beforeAll(() => {
	// The board locks the viewport on grab; core is otherwise DOM-free here.
	(globalThis as any).document ??= { documentElement: { style: {} } };
});

const setup = () => {
	const board = new InternalFlexiBoardController({ config: {} } as any, null);
	const target = board.createTarget(
		{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } } as any,
		'left'
	);
	target.createGrid();

	return {
		board,
		target,
		bus: getFlexiEventBus(),
		inGrid: () => (target.grid as any).getWidgetsForModification()
	};
};

const grab = (ctx: ReturnType<typeof setup>, widget: any) =>
	ctx.bus.dispatch('widget:grabbed', {
		board: ctx.board,
		target: ctx.target,
		widget,
		clientX: 0,
		clientY: 0,
		xOffset: 0,
		yOffset: 0,
		capturedWidthPx: 100,
		capturedHeightPx: 100
	} as any);

describe('widget deletion', () => {
	it('frees grid space when deleted over a deleter mid-grab', async () => {
		// Regression: the delete is dispatched from inside the board's release
		// handler, so the target's own release subscriber ran afterwards with
		// actionWidget still set and dropped the deleted widget back into the grid.
		// It stopped rendering (gone from this.widgets) but kept occupying cells.
		const ctx = setup();
		const a = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;
		ctx.target.createWidget({ x: 1, y: 0, width: 1, height: 1 } as any)!;

		grab(ctx, a);
		ctx.board.onenterdeleter();
		ctx.bus.dispatch('widget:release', { board: ctx.board, target: ctx.target, widget: a } as any);

		expect(ctx.target.widgets.has(a)).toBe(false);
		expect(ctx.inGrid()).not.toContain(a);

		// The board's safety net runs in a microtask — it must not resurrect it.
		await Promise.resolve();
		expect(ctx.inGrid()).not.toContain(a);
	});

	it('frees grid space when dragged out of the target onto a deleter', async () => {
		// The real deleter path: reaching the deleter means the pointer left the
		// target, which already cleared actionWidget. The pre-grab snapshot has to
		// be dropped on the widget's identity instead, or the board's microtask
		// safety net restores a grid state that still contains the deleted widget.
		const ctx = setup();
		const a = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;
		ctx.target.createWidget({ x: 1, y: 0, width: 1, height: 1 } as any)!;

		grab(ctx, a);
		ctx.bus.dispatch('widget:leavetarget', {
			board: ctx.board,
			target: ctx.target,
			widget: a
		} as any);
		expect(ctx.target.actionWidget).toBeNull();

		ctx.board.onenterdeleter();
		// No hovered target once the pointer is over the deleter.
		ctx.bus.dispatch('widget:release', { board: ctx.board, target: undefined, widget: a } as any);

		expect(ctx.inGrid()).not.toContain(a);
		expect(ctx.target.hasPreGrabSnapshot()).toBe(false);

		await Promise.resolve();
		expect(ctx.inGrid()).not.toContain(a);
		expect(ctx.target.widgets.has(a)).toBe(false);
	});

	it('still restores the grid when a grab is abandoned without deleting', async () => {
		// The safety net must keep working for its actual purpose: a widget
		// released outside every target returns to where it started.
		const ctx = setup();
		const a = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;

		grab(ctx, a);
		ctx.bus.dispatch('widget:leavetarget', {
			board: ctx.board,
			target: ctx.target,
			widget: a
		} as any);
		ctx.bus.dispatch('widget:release', { board: ctx.board, target: undefined, widget: a } as any);

		await Promise.resolve();
		expect(ctx.inGrid()).toContain(a);
	});

	it('leaves the freed cell usable', async () => {
		const ctx = setup();
		const a = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;

		grab(ctx, a);
		ctx.board.onenterdeleter();
		ctx.bus.dispatch('widget:release', { board: ctx.board, target: ctx.target, widget: a } as any);
		await Promise.resolve();

		const replacement = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any);

		expect(replacement).toBeDefined();
		expect([replacement!.x, replacement!.y]).toEqual([0, 0]);
	});

	it('ends the action so no dropzone is left behind', () => {
		const ctx = setup();
		const a = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;

		grab(ctx, a);
		expect(ctx.target.actionWidget).not.toBeNull();

		ctx.board.onenterdeleter();
		ctx.bus.dispatch('widget:release', { board: ctx.board, target: ctx.target, widget: a } as any);

		expect(ctx.target.actionWidget).toBeNull();
		expect(ctx.target.dropzoneWidget).toBeNull();
	});

	it('deletes an ungrabbed widget without disturbing the others', () => {
		const ctx = setup();
		const a = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;
		const b = ctx.target.createWidget({ x: 1, y: 0, width: 1, height: 1 } as any)!;

		a.delete();

		expect(ctx.target.widgets.has(a)).toBe(false);
		expect(ctx.target.widgets.has(b)).toBe(true);
		expect(ctx.inGrid()).toContain(b);
		expect([b.x, b.y]).toEqual([1, 0]);
	});

	it('keeps an in-progress grab alive when a different widget is deleted', () => {
		const ctx = setup();
		const a = ctx.target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;
		const b = ctx.target.createWidget({ x: 1, y: 0, width: 1, height: 1 } as any)!;

		grab(ctx, a);
		b.delete();

		expect(ctx.target.actionWidget?.widget).toBe(a);
	});
});
