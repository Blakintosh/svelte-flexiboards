import { afterEach, describe, expect, it, vi } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';
import { InternalFlexiWidgetController } from '../widget/controller.js';
import { getFlexiEventBus } from '../shared/event-bus.js';
import type { FlexiBoardConfiguration, FlexiWidgetLayoutEntry } from '../board/types.js';

let board: InternalFlexiBoardController;

function setup(config: FlexiBoardConfiguration = { registry: { card: {} } }) {
	board = new InternalFlexiBoardController({ config });
	const target = board.createTarget(
		{ layout: { type: 'free', minColumns: 4, maxColumns: 4, minRows: 4, maxRows: 4 } },
		'main'
	);
	target.oninitialloadcomplete();
	board.oninitialloadcomplete();
	return target;
}

const entry: FlexiWidgetLayoutEntry = {
	id: 'saved-card',
	type: 'card',
	x: 1,
	y: 2,
	width: 2,
	height: 1,
	metadata: { title: 'Saved card' }
};

afterEach(() => {
	board?.destroy();
	vi.restoreAllMocks();
});

describe('real controller import/export', () => {
	it('exposes the target key through typed drop callbacks', () => {
		const target = setup({ canDrop: ({ target }) => target.key !== 'blocked' });
		const widget = target.createWidget({ x: 0, y: 0 })!;
		expect(board.canDrop(widget, target, { x: 0, y: 0, width: 1, height: 1 })).toBe(true);
	});
	it('round-trips positions, dimensions, IDs and metadata through the envelope', () => {
		const target = setup();
		target.createWidget(entry);
		const saved = board.exportLayoutEnvelope();
		for (let i = 0; i < 3; i++) {
			board.importLayout(saved);
			expect(board.exportLayoutEnvelope()).toEqual(saved);
			expect(target.orderedWidgets).toHaveLength(1);
		}
		expect(saved.layout.main).toEqual([entry]);
	});

	it('clears data and rendered widgets on an empty import without deletion callbacks', () => {
		const onWidgetDelete = vi.fn();
		const target = setup({ registry: { card: {} }, onWidgetDelete });
		const old = target.createWidget(entry)!;
		const destroy = vi.spyOn(old, 'destroy');
		board.importLayout({ main: [] });
		expect(target.widgets.size).toBe(0);
		expect(target.orderedWidgets).toEqual([]);
		expect(board.exportLayout()).toEqual({ main: [] });
		expect(destroy).toHaveBeenCalledOnce();
		expect(onWidgetDelete).not.toHaveBeenCalled();
		expect(target.createWidget(entry)).toBeDefined();
	});

	it('disposes replaced controllers and keeps subscription counts bounded', () => {
		const bus = getFlexiEventBus();
		const subscribe = bus.subscribe.bind(bus);
		let active = 0;
		vi.spyOn(bus, 'subscribe').mockImplementation((event, listener) => {
			const stop = subscribe(event, listener);
			active++;
			let stopped = false;
			return () => {
				if (!stopped) active--;
				stopped = true;
				stop();
			};
		});
		setup();
		board.importLayout({ main: [entry] });
		const baseline = active;
		for (let i = 0; i < 5; i++) {
			board.importLayout({ main: [entry] });
			expect(active).toBe(baseline);
		}
		board.importLayout({ main: [] });
		expect(active).toBeLessThan(baseline);
	});

	it('does not retain a controller when placement fails', () => {
		const target = setup();
		target.createWidget({ ...entry, draggability: 'none' });
		const destroy = vi.spyOn(InternalFlexiWidgetController.prototype, 'destroy');
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(target.createWidget(entry)).toBeUndefined();
		expect(destroy).toHaveBeenCalledOnce();
	});

	it('skips invalid types without retaining the previous rendered layout', () => {
		const target = setup();
		target.createWidget(entry);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		board.importLayout({
			main: [
				{ ...entry, type: 'missing' },
				{ ...entry, type: undefined }
			]
		});
		expect(warn).toHaveBeenCalledTimes(2);
		expect(target.orderedWidgets).toEqual([]);
		board.importLayout({ main: [{ ...entry, type: 'missing' }, entry] });
		expect(target.orderedWidgets).toHaveLength(1);
	});

	it('leaves a layout alone when importing without a registry', () => {
		const target = setup({});
		target.createWidget({ x: 0, y: 0 });
		const saved = board.exportLayout();
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		board.importLayout({ main: [entry] });
		expect(board.exportLayout()).toEqual(saved);
	});

	it('exports untyped widgets and assigns stable IDs to generated widgets', () => {
		const target = setup();
		target.createWidget({ x: 0, y: 0 });
		const saved = board.exportLayout();
		expect(saved.main).toHaveLength(1);
		expect(saved.main[0].id).toEqual(expect.any(String));
		expect(saved.main[0].type).toBeUndefined();
		expect(board.exportLayout()).toEqual(saved);
	});
});
