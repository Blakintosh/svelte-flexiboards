import { describe, it, expect, vi } from 'vitest';
import { FreeFormFlexiGrid } from './free-grid.svelte.js';
import { FlowFlexiGrid } from './flow-grid.svelte.js';
import type { FlexiTargetConfiguration } from '../target/index.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';
import type { WidgetDraggability } from '../types.js';

// TODO - for some reason the test suite can't figure out that the FlexiGrid class is available, so this is a hack to fix it
vi.mock('./base.svelte.js', () => ({
	FlexiGrid: class FlexiGrid {
		constructor() {}
	}
}));

type MockWidgetOptions = {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	draggability?: WidgetDraggability;
	id?: string;
};

const createMockWidget = (options: MockWidgetOptions = {}): InternalFlexiWidgetController => {
	const {
		x = 0,
		y = 0,
		width = 1,
		height = 1,
		minWidth = 1,
		maxWidth = Infinity,
		minHeight = 1,
		maxHeight = Infinity,
		draggability = 'full',
		id = `widget-${Math.random().toString(36).substring(2, 9)}`
	} = options;

	const widget = {
		x,
		y,
		width,
		height,
		minWidth,
		maxWidth,
		minHeight,
		maxHeight,
		draggability,
		draggable: draggability == 'full',
		isMovable: draggability == 'full' || draggability == 'movable',
		isShadow: false,
		id,
		setBounds: vi.fn().mockImplementation(function (
			newX: number,
			newY: number,
			newWidth: number,
			newHeight: number
		) {
			widget.x = newX;
			widget.y = newY;
			widget.width = newWidth;
			widget.height = newHeight;
		})
	};

	return widget as unknown as InternalFlexiWidgetController;
};

const createFreeGrid = (layout: Record<string, unknown>) => {
	const targetConfig: FlexiTargetConfiguration = {
		layout: { type: 'free', ...layout } as FlexiTargetConfiguration['layout'],
		rowSizing: 'auto',
		columnSizing: 'auto'
	};
	return new FreeFormFlexiGrid({} as InternalFlexiTargetController, targetConfig);
};

const createFlowGrid = (layout: Record<string, unknown>) => {
	const targetConfig: FlexiTargetConfiguration = {
		layout: {
			type: 'flow',
			flowAxis: 'row',
			placementStrategy: 'append',
			...layout
		} as FlexiTargetConfiguration['layout'],
		rowSizing: 'auto',
		columnSizing: 'auto'
	};
	return new FlowFlexiGrid({} as InternalFlexiTargetController, targetConfig);
};

type GridSnapshot = {
	layout: unknown[][];
	bitmaps: number[];
	rows: number;
	columns: number;
};

describe('FreeFormFlexiGrid transactionality', () => {
	it('discards displacement operations from failed exploratory branches', () => {
		// Layout (6 columns, 3 rows):
		//   - B (2 wide) at (1,0) collides when A (3 wide) is placed at (0,0).
		//   - B's rightward escape to columns 3-4 first displaces C at (3,0) — recording a
		//     speculative move to (5,0) — then hits the immovable D at (4,0) and fails.
		//   - B then succeeds by moving down instead, so C must NOT be moved.
		const grid = createFreeGrid({ minColumns: 6, minRows: 3 });

		const b = createMockWidget({ width: 2 });
		const c = createMockWidget();
		const d = createMockWidget({ draggability: 'none' });
		expect(grid.tryPlaceWidget(b, 1, 0, 2, 1)).toBe(true);
		expect(grid.tryPlaceWidget(c, 3, 0, 1, 1)).toBe(true);
		expect(grid.tryPlaceWidget(d, 4, 0, 1, 1)).toBe(true);

		const a = createMockWidget({ width: 3 });
		expect(grid.tryPlaceWidget(a, 0, 0, 3, 1)).toBe(true);

		// A placed, B displaced downwards, C and D untouched.
		expect([a.x, a.y]).toEqual([0, 0]);
		expect([b.x, b.y]).toEqual([1, 1]);
		expect([c.x, c.y]).toEqual([3, 0]);
		expect([d.x, d.y]).toEqual([4, 0]);
	});

	it('rolls back grid expansion when a placement fails on a collision', () => {
		const grid = createFreeGrid({ minColumns: 3, minRows: 3, maxColumns: 5, maxRows: 3 });

		const immovable = createMockWidget({ draggability: 'none' });
		expect(grid.tryPlaceWidget(immovable, 1, 1, 1, 1)).toBe(true);

		// Spans columns 1-3, forcing an expansion to 4 columns before colliding with the
		// immovable widget. The failed placement must not keep the expansion.
		const wide = createMockWidget({ width: 3 });
		expect(grid.tryPlaceWidget(wide, 1, 1, 3, 1)).toBe(false);

		expect(grid.columns).toBe(3);
		expect(grid.rows).toBe(3);
	});

	it('keeps the coordinate system consistent when restoring a snapshot larger than the grid', () => {
		const grid = createFreeGrid({ minColumns: 2, minRows: 2 });

		// Expand to 3x3 by placing a widget at (2,2), snapshot, then shrink back via removal.
		const widget = createMockWidget();
		expect(grid.tryPlaceWidget(widget, 2, 2, 1, 1)).toBe(true);
		const snapshot = grid.takeSnapshot();

		grid.removeWidget(widget);
		grid.applyPostCompletionOperations();
		expect(grid.rows).toBe(2);

		// Restoring must resize the occupancy arrays exactly to the snapshot's dimensions.
		grid.restoreFromSnapshot(snapshot);
		const restored = grid.takeSnapshot() as GridSnapshot;
		expect(restored.rows).toBe(3);
		expect(restored.columns).toBe(3);
		expect(restored.bitmaps.length).toBe(3);
		expect(restored.layout.length).toBe(3);
		expect(restored.layout[0].length).toBe(3);
	});

	it('restores the previous placement when re-placing a widget fails', () => {
		const grid = createFreeGrid({ minColumns: 3, minRows: 3, maxColumns: 3, maxRows: 3 });

		const blocker = createMockWidget({ draggability: 'none', width: 3 });
		expect(grid.tryPlaceWidget(blocker, 0, 2, 3, 1)).toBe(true);

		const widget = createMockWidget();
		expect(grid.tryPlaceWidget(widget, 0, 0, 1, 1)).toBe(true);

		// Moving onto the immovable blocker fails; the widget must still occupy (0,0).
		expect(grid.tryPlaceWidget(widget, 0, 2, 1, 1)).toBe(false);
		expect([widget.x, widget.y]).toEqual([0, 0]);

		const snapshot = grid.takeSnapshot() as GridSnapshot;
		expect(snapshot.bitmaps[0] & 0b1).toBe(0b1); // (0,0) still occupied by the widget
		expect(snapshot.bitmaps[2]).toBe(0b111); // blocker row untouched
	});

	it('moves a widget already in the grid without colliding with itself', () => {
		const grid = createFreeGrid({ minColumns: 3, minRows: 3 });

		const widget = createMockWidget();
		expect(grid.tryPlaceWidget(widget, 0, 0, 1, 1)).toBe(true);
		expect(grid.tryPlaceWidget(widget, 1, 0, 1, 1)).toBe(true);
		expect([widget.x, widget.y]).toEqual([1, 0]);

		// The old footprint must be vacated — exactly one cell occupied, with no stale
		// double-registration at (0,0).
		const snapshot = grid.takeSnapshot() as GridSnapshot;
		expect(snapshot.bitmaps[0]).toBe(0b10);
	});
});

describe('FreeFormFlexiGrid input hardening', () => {
	it('refuses to remove a widget that is not in the grid', () => {
		const grid = createFreeGrid({ minColumns: 3, minRows: 3 });

		const widget = createMockWidget();
		expect(grid.tryPlaceWidget(widget, 0, 0, 1, 1)).toBe(true);

		// A stray widget claiming the same cells must not clear the real widget's occupancy.
		const stray = createMockWidget();
		expect(grid.removeWidget(stray)).toBe(false);

		const snapshot = grid.takeSnapshot() as GridSnapshot;
		expect(snapshot.bitmaps[0] & 0b1).toBe(0b1);
	});

	it('clamps negative coordinates and zero sizes into the valid domain', () => {
		const grid = createFreeGrid({ minColumns: 3, minRows: 3 });

		const widget = createMockWidget({ minWidth: 0, minHeight: 0 });
		expect(grid.tryPlaceWidget(widget, -2, -1, 0, 0)).toBe(true);
		expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 1, 1);
	});

	it('detects collisions in column 31 (sign bit of the row bitmap)', () => {
		const grid = createFreeGrid({ minColumns: 32, minRows: 1 });

		const a = createMockWidget();
		expect(grid.tryPlaceWidget(a, 31, 0, 1, 1)).toBe(true);

		const b = createMockWidget();
		expect(grid.tryPlaceWidget(b, 31, 0, 1, 1)).toBe(true);

		// The collision must have been detected and resolved — no overlap.
		expect([a.x, a.y]).not.toEqual([b.x, b.y]);
	});

	it('clamps configured column counts to the 32-column bitmap limit', () => {
		const grid = createFreeGrid({ minColumns: 40, minRows: 1 });

		expect(grid.columns).toBe(32);
	});
});

describe('FlowFlexiGrid transactionality', () => {
	it('leaves the grid untouched when an insert fails partway through the shift chain', () => {
		// 2-column row flow capped at 2 rows: B and C fill it exactly.
		const grid = createFlowGrid({ columns: 2, rows: 1, maxFlowAxis: 2 });

		const b = createMockWidget();
		const c = createMockWidget({ width: 2 });
		expect(grid.tryPlaceWidget(b)).toBe(true);
		expect(grid.tryPlaceWidget(c, undefined, undefined, 2, 1)).toBe(true);
		expect([b.x, b.y]).toEqual([0, 0]);
		expect([c.x, c.y]).toEqual([0, 1]);

		// Inserting D before C pushes C past the flow axis cap — the whole insert must roll back.
		const d = createMockWidget({ width: 2 });
		expect(grid.tryPlaceWidget(d, 1, 0, 2, 1)).toBe(false);

		expect(grid.rows).toBe(2);
		expect(grid.widgets).toHaveLength(2);
		expect([b.x, b.y]).toEqual([0, 0]);
		expect([c.x, c.y]).toEqual([0, 1]);
	});

	it('never lets a minimum size push a widget past the cross axis', () => {
		const grid = createFlowGrid({ columns: 2, rows: 1, maxFlowAxis: 4 });

		const widget = createMockWidget({ minWidth: 5 });
		expect(grid.tryPlaceWidget(widget, undefined, undefined, 5, 1)).toBe(true);

		// minWidth 5 cannot be honoured in a 2-column grid; the grid bound wins.
		expect(widget.width).toBe(2);
		expect(widget.x).toBe(0);
	});
});
