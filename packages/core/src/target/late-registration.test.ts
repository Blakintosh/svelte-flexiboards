import { afterEach, expect, it, vi } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';
import type { FlexiBoardConfiguration } from '../board/types.js';
import type { FlexiTargetPartialConfiguration } from './types.js';

let board: InternalFlexiBoardController;
const free = {
	layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 2, maxRows: 2 }
} as const;

function setup(
	config: FlexiBoardConfiguration = {},
	targetConfig: FlexiTargetPartialConfiguration = free
) {
	board = new InternalFlexiBoardController({ config });
	const target = board.createTarget(targetConfig, 'cards');
	target.oninitialloadcomplete();
	board.oninitialloadcomplete();
	return target;
}

afterEach(() => {
	board?.destroy();
	vi.restoreAllMocks();
});

it('places late declarations and reports one committed layout for synchronous additions', async () => {
	const onLayoutChange = vi.fn();
	const target = setup({ onLayoutChange });
	const onCreated = vi.fn();
	target.registerWidget({ id: 'one', x: 0, y: 0 }, onCreated);
	target.registerWidget({ id: 'two', x: 1, y: 1 }, onCreated);
	expect(onCreated).toHaveBeenCalledTimes(2);
	expect(target.orderedWidgets).toHaveLength(2);
	await Promise.resolve();
	expect(onLayoutChange).toHaveBeenCalledOnce();
	expect(board.exportLayout().cards).toEqual([
		expect.objectContaining({ id: 'one', x: 0, y: 0 }),
		expect.objectContaining({ id: 'two', x: 1, y: 1 })
	]);
	target.oninitialloadcomplete();
	expect(onCreated).toHaveBeenCalledTimes(2);
	expect(target.orderedWidgets).toHaveLength(2);
});

it.each([
	{ x: 2, y: 0 },
	{ x: 1, y: 0, width: 2 },
	{ x: 0, y: 0 }
])('rejects an impossible late placement %j without changing the layout', async (config) => {
	const onLayoutChange = vi.fn();
	const target = setup({ onLayoutChange });
	target.createWidget({ id: 'fixed', x: 0, y: 0, draggability: 'none' });
	await Promise.resolve();
	onLayoutChange.mockClear();
	const before = board.exportLayout();
	const onCreated = vi.fn();
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	target.registerWidget(config, onCreated);
	await Promise.resolve();
	expect(board.exportLayout()).toEqual(before);
	expect(onCreated).not.toHaveBeenCalled();
	expect(onLayoutChange).not.toHaveBeenCalled();
	expect(warn).toHaveBeenCalledOnce();
});

it('appends late declarations according to flow-grid placement', () => {
	const target = setup(
		{},
		{ layout: { type: 'flow', flowAxis: 'row', columns: 1, placementStrategy: 'append' } }
	);
	target.registerWidget({ id: 'one' });
	target.registerWidget({ id: 'two' });
	expect(board.exportLayout().cards).toEqual([
		expect.objectContaining({ id: 'one', x: 0, y: 0 }),
		expect.objectContaining({ id: 'two', x: 0, y: 1 })
	]);
});

it('adds to an imported initial layout without reapplying or duplicating it', () => {
	const target = setup({
		registry: { card: {} },
		initialLayout: { cards: [{ id: 'saved', type: 'card', x: 0, y: 0, width: 1, height: 1 }] }
	});
	target.registerWidget({ id: 'late', x: 1, y: 1 });
	target.oninitialloadcomplete();
	expect(board.exportLayout().cards.map(({ id }) => id)).toEqual(['saved', 'late']);
});
