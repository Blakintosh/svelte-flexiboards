// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { InternalFlexiBoardController } from './controller.js';
import { getFlexiEventBus } from '../shared/event-bus.js';
import { getPointerService } from '../shared/utils.js';
import {
	LAYOUT_FORMAT_VERSION,
	type FlexiBoardConfiguration,
	type FlexiDropCheck
} from './types.js';

/*
  The controller API a consumer reaches from a hook or `onfirstcreate`:
  widget.delete(), widget.moveTo(), target.clear(), board.clear(), the board
  callbacks (onWidgetGrab/Drop/Cancel/Delete), canDrop, and onLayoutChange
  firing for programmatic changes too.
*/

const rect = (left: number, top: number, width = 300, height = 300) =>
	({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

function setup(config: FlexiBoardConfiguration = {}) {
	const board = new InternalFlexiBoardController(
		{ config: { registry: { t: {} }, ...config } } as any,
		null
	);
	board.ref = document.body;
	const column = (key: string, left: number) => {
		const target = board.createTarget(
			{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } } as any,
			key
		);
		const grid = target.createGrid();
		const el = document.createElement('div');
		document.body.appendChild(el);
		el.getBoundingClientRect = () => rect(left, 0);
		grid.ref = el;
		return target;
	};
	const a = column('a', 0);
	const b = column('b', 400);
	a.oninitialloadcomplete();
	b.oninitialloadcomplete();
	board.oninitialloadcomplete();
	return { board, a, b, bus: getFlexiEventBus(), pointer: getPointerService() };
}

afterEach(() => {
	vi.useRealTimers();
	document.body.innerHTML = '';
});

describe('controller API', () => {
	it('deletes a widget and reports it', () => {
		const onWidgetDelete = vi.fn();
		const { a } = setup({ onWidgetDelete });
		const w = a.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any)!;

		w.delete();

		expect(a.widgets.has(w)).toBe(false);
		expect(onWidgetDelete).toHaveBeenCalledWith({ widget: w, target: a });
	});

	it('moves a widget within its target, to another target, and refuses an impossible spot', () => {
		const { board, a, b } = setup();
		const w = a.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any)!;
		const blocker = b.createWidget({ type: 't', x: 2, y: 2, width: 1, height: 1 } as any)!;

		expect(w.moveTo({ x: 2, y: 1 })).toBe(true);
		expect([w.x, w.y]).toEqual([2, 1]);

		expect(w.moveTo({ target: b, x: 0, y: 0 })).toBe(true);
		expect(w.target).toBe(b);
		expect(a.widgets.has(w)).toBe(false);
		expect(b.widgets.has(w)).toBe(true);
		expect(board.exportLayout()).toEqual({
			a: [],
			b: [expect.objectContaining({ x: 2, y: 2 }), expect.objectContaining({ x: 0, y: 0 })]
		});

		// Out of bounds: nothing changes.
		expect(w.moveTo({ x: 5, y: 5 })).toBe(false);
		expect([w.x, w.y, w.target]).toEqual([0, 0, b]);
		expect(blocker.target).toBe(b);
	});

	it('clears a target and the whole board', () => {
		const { board, a, b } = setup();
		a.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any);
		a.createWidget({ type: 't', x: 1, y: 0, width: 1, height: 1 } as any);
		b.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any);

		a.clear();
		expect(a.widgets.size).toBe(0);
		expect(b.widgets.size).toBe(1);

		board.clear();
		expect(b.widgets.size).toBe(0);
	});

	it('fires onLayoutChange for programmatic changes, but not for the initial load or an import', () => {
		vi.useFakeTimers();
		const onLayoutChange = vi.fn();
		const { board, a } = setup({ onLayoutChange });
		vi.runAllTimers();
		expect(onLayoutChange).not.toHaveBeenCalled();

		board.importLayout({ a: [{ type: 't', x: 0, y: 0, width: 1, height: 1 }] });
		vi.runAllTimers();
		expect(onLayoutChange).not.toHaveBeenCalled();

		const w = a.createWidget({ type: 't', x: 1, y: 0, width: 1, height: 1 } as any)!;
		vi.runAllTimers();
		expect(onLayoutChange).toHaveBeenCalledTimes(1);

		w.moveTo({ x: 2, y: 2 });
		vi.runAllTimers();
		expect(onLayoutChange).toHaveBeenCalledTimes(2);
		expect(onLayoutChange).toHaveBeenLastCalledWith({
			a: [expect.objectContaining({ x: 0, y: 0 }), expect.objectContaining({ x: 2, y: 2 })],
			b: []
		});

		w.delete();
		vi.runAllTimers();
		expect(onLayoutChange).toHaveBeenCalledTimes(3);
	});

	it('exports widgets without a type instead of dropping them', () => {
		const { board, a } = setup();
		a.createWidget({ x: 0, y: 0, width: 1, height: 1, metadata: { note: 'kept' } } as any);
		expect(board.exportLayout().a).toEqual([
			expect.objectContaining({ x: 0, y: 0, width: 1, height: 1, metadata: { note: 'kept' } })
		]);
		expect('type' in board.exportLayout().a[0]).toBe(false);
	});

	it('reports grabs, drops and cancels of user interactions', () => {
		const onWidgetGrab = vi.fn();
		const onWidgetDrop = vi.fn();
		const onWidgetCancel = vi.fn();
		const { board, a, b, bus, pointer } = setup({ onWidgetGrab, onWidgetDrop, onWidgetCancel });
		const w = a.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any)!;

		const grab = () =>
			bus.dispatch('widget:grabbed', {
				board,
				target: a,
				widget: w,
				clientX: 50,
				clientY: 50,
				xOffset: 0,
				yOffset: 0,
				capturedWidthPx: 100,
				capturedHeightPx: 100
			} as any);

		pointer.updatePosition(50, 50);
		grab();
		expect(onWidgetGrab).toHaveBeenCalledWith({ widget: w, target: a });

		pointer.updatePosition(450, 50);
		bus.dispatch('widget:release', { board, target: b, widget: w } as any);
		expect(onWidgetDrop).toHaveBeenCalledWith({ widget: w, sourceTarget: a, target: b });
		expect(w.target).toBe(b);

		grab();
		bus.dispatch('widget:cancel', { board, target: b, widget: w } as any);
		expect(onWidgetCancel).toHaveBeenCalledWith({ widget: w, target: b });
	});

	it('lets canDrop reject a placement, shown on the preview and enforced on release', async () => {
		let forbidden: unknown;
		const canDrop = vi.fn((check: FlexiDropCheck) => check.target !== forbidden);
		const { board, a, b, bus, pointer } = setup({ canDrop });
		forbidden = b;
		const w = a.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any)!;

		pointer.updatePosition(50, 50);
		bus.dispatch('widget:grabbed', {
			board,
			target: a,
			widget: w,
			clientX: 50,
			clientY: 50,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 100,
			capturedHeightPx: 100
		} as any);

		pointer.updatePosition(450, 50);
		expect(canDrop).toHaveBeenLastCalledWith(
			expect.objectContaining({
				widget: w,
				target: b,
				x: expect.any(Number),
				y: expect.any(Number)
			})
		);
		expect(b.dropRejected).toBe(true);

		bus.dispatch('widget:release', { board, target: b, widget: w } as any);
		// The board's safety net restores the source target on the next microtask.
		await Promise.resolve();
		expect(b.widgets.has(w)).toBe(false);
		expect(a.widgets.has(w)).toBe(true);
		expect([w.x, w.y]).toEqual([0, 0]);
	});

	it('exports an id for every widget and round-trips it', () => {
		const { board, a } = setup();
		const given = a.createWidget({
			type: 't',
			id: 'mine',
			x: 0,
			y: 0,
			width: 1,
			height: 1
		} as any)!;
		const generated = a.createWidget({ type: 't', x: 1, y: 0, width: 1, height: 1 } as any)!;
		const exported = board.exportLayout().a;
		expect(exported.map((e) => e.id)).toEqual(['mine', generated.id]);
		expect(generated.id).toMatch(/^flexiwidget-\d+-[a-z0-9]+$/);

		board.importLayout({ a: exported });
		const again = [...a.widgets].map((w) => w.userProvidedId);
		expect(again).toEqual(['mine', generated.id]);
		expect(given.userProvidedId).toBe('mine');
	});

	it('imports and exports the versioned envelope', () => {
		const { board, a } = setup();
		a.createWidget({ type: 't', x: 2, y: 2, width: 1, height: 1 } as any);
		const envelope = board.exportLayoutEnvelope();
		expect(envelope.version).toBe(LAYOUT_FORMAT_VERSION);
		expect(envelope.layout.a).toHaveLength(1);

		board.importLayout({
			version: 1,
			layout: { a: [{ type: 't', x: 0, y: 0, width: 1, height: 1 }] }
		});
		expect([...a.widgets].map((w) => [w.x, w.y])).toEqual([[0, 0]]);
	});

	it('lets a target refuse a drop on top of the board rule', async () => {
		const { board, a, b, bus, pointer } = setup();
		b.updateConfig({
			layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 },
			canDrop: () => false
		} as any);
		const w = a.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any)!;
		pointer.updatePosition(50, 50);
		bus.dispatch('widget:grabbed', {
			board,
			target: a,
			widget: w,
			clientX: 50,
			clientY: 50,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 100,
			capturedHeightPx: 100
		} as any);
		pointer.updatePosition(450, 50);
		expect(b.dropRejected).toBe(true);
		bus.dispatch('widget:release', { board, target: b, widget: w } as any);
		await Promise.resolve();
		expect(a.widgets.has(w)).toBe(true);
		expect(b.widgets.has(w)).toBe(false);
	});

	it('reports enter and leave as a widget is carried over targets', () => {
		const onWidgetEnterTarget = vi.fn();
		const onWidgetLeaveTarget = vi.fn();
		const { board, a, b, bus, pointer } = setup({ onWidgetEnterTarget, onWidgetLeaveTarget });
		const w = a.createWidget({ type: 't', x: 0, y: 0, width: 1, height: 1 } as any)!;
		pointer.updatePosition(50, 50);
		bus.dispatch('widget:grabbed', {
			board,
			target: a,
			widget: w,
			clientX: 50,
			clientY: 50,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 100,
			capturedHeightPx: 100
		} as any);
		pointer.updatePosition(350, 50); // between the targets
		expect(onWidgetLeaveTarget).toHaveBeenLastCalledWith({ widget: w, target: a });
		pointer.updatePosition(450, 50);
		expect(onWidgetEnterTarget).toHaveBeenLastCalledWith({ widget: w, target: b });
		bus.dispatch('widget:cancel', { board, target: b, widget: w } as any);
	});

	it('reports a committed resize separately from a drop', () => {
		const onWidgetDrop = vi.fn();
		const onWidgetResize = vi.fn();
		const { board, a, bus, pointer } = setup({ onWidgetDrop, onWidgetResize });
		const w = a.createWidget({
			type: 't',
			x: 0,
			y: 0,
			width: 1,
			height: 1,
			resizability: 'both'
		} as any)!;
		pointer.updatePosition(100, 100);
		bus.dispatch('widget:resizing', {
			board,
			target: a,
			widget: w,
			offsetX: 0,
			offsetY: 0,
			clientX: 100,
			clientY: 100,
			left: 0,
			top: 0,
			capturedWidthPx: 100,
			capturedHeightPx: 100
		} as any);
		pointer.updatePosition(250, 250);
		bus.dispatch('widget:release', { board, target: a, widget: w } as any);
		expect(onWidgetResize).toHaveBeenCalledWith({ widget: w, target: a });
		expect(onWidgetDrop).not.toHaveBeenCalled();
	});

	it('warns when a widget is declared after its target has loaded', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { a } = setup();
		a.registerWidget({ width: 1, height: 1 } as any);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('declared after target "a" loaded'));
		warn.mockRestore();
	});
});
