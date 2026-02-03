import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlexiGrid } from './base.svelte.js';
import type { FlexiWidgetController } from '../widget.svelte';
import type { FlexiTargetConfiguration, InternalFlexiTargetController } from '../target.svelte';
import { FlowFlexiGrid, type FlowTargetLayout } from './flow-grid.svelte.js';

// TODO - for some reason the test suite can't figure out that the FlexiGrid class is available, so this is a hack to fix it
vi.mock('./base.svelte.js', () => ({
	FlexiGrid: class FlexiGrid {
		constructor() {}
		// Mock any methods used in the test
	}
}));

describe('FlowFlexiGrid', () => {
	let grid: FlowFlexiGrid;
	let mockTarget: InternalFlexiTargetController;
	let targetConfig: FlexiTargetConfiguration;

	const createMockWidget = (
		x = 0,
		y = 0,
		width = 1,
		height = 1,
		draggable = true,
		minWidth = 1,
		maxWidth = Infinity,
		minHeight = 1,
		maxHeight = Infinity
	): FlexiWidgetController => {
		const widget = {
			x,
			y,
			width,
			height,
			draggable,
			minWidth,
			maxWidth,
			minHeight,
			maxHeight,
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
			}),
			id: `widget-${Math.random().toString(36).substring(2, 9)}`
		};

		return widget as unknown as FlexiWidgetController;
	};

	type Placement = {
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		grid?: FlowFlexiGrid;
		expectedResult?: boolean;
	};

	const mockWidgetPlacement = (placement: Placement) => {
		placement.height ??= 1;
		placement.width ??= 1;
		placement.grid ??= grid;
		placement.expectedResult ??= true;

		const widget = createMockWidget(placement.x, placement.y, placement.width, placement.height);
		const result = placement.grid.tryPlaceWidget(
			widget,
			placement.x,
			placement.y,
			placement.width,
			placement.height
		);

		expect(result).toBe(placement.expectedResult);

		return widget;
	};

	const expectPlacement = (widget: FlexiWidgetController, placement: Placement) => {
		expect(widget.setBounds).toHaveBeenCalledWith(
			placement.x,
			placement.y,
			placement.width ?? widget.width,
			placement.height ?? widget.height
		);
	};

	beforeEach(() => {
		mockTarget = {} as InternalFlexiTargetController;
		targetConfig = {
			layout: {
				type: 'flow',
				placementStrategy: 'append',
				flowAxis: 'row',
				rows: 3,
				columns: 3
			},
			rowSizing: 'auto',
			columnSizing: 'auto'
		};

		grid = new FlowFlexiGrid(mockTarget, targetConfig);
	});

	describe('Basic widget placement', () => {
		it('should place a widget at the start when empty, no matter the input location', () => {
			const widget = mockWidgetPlacement({ x: 2, y: 0, width: 1, height: 1 });

			// State:
			// a--

			expectPlacement(widget, { x: 0, y: 0 });
		});

		it('should ignore height when placing a widget into row flow', () => {
			const widget = mockWidgetPlacement({ x: 2, y: 0, width: 1, height: 2 });

			// State:
			// a--

			expectPlacement(widget, { x: 0, y: 0, height: 1 });
		});

		it('should ignore width when placing a widget into column flow', () => {
			const columnGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					flowAxis: 'column'
				}
			});
			const widget = createMockWidget();

			const result = columnGrid.tryPlaceWidget(widget, 2, 0, 2, 1);

			// State:
			// a
			// -
			// -

			expect(result).toBe(true);
			expectPlacement(widget, { x: 0, y: 0, width: 1 });
		});
	});

	describe('Widget insertion', () => {
		it('should place a widget before a colliding one if before half-way through', () => {
			mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });
			const b = mockWidgetPlacement({ x: 1, y: 0, width: 2, height: 1 });

			// State:
			// abb

			const c = mockWidgetPlacement({ x: 1, y: 0, width: 1, height: 1 });

			// Expected state:
			// ac-
			// bb-

			expectPlacement(b, { x: 0, y: 1 });
			expectPlacement(c, { x: 1, y: 0 });
		});

		it('should place a widget after a colliding one if after half-way through', () => {
			const a = mockWidgetPlacement({ x: 0, y: 0, width: 3, height: 1 });

			// State:
			// aaa

			const b = mockWidgetPlacement({ x: 2, y: 0, width: 1, height: 1 });

			// Expected state:
			// aaa
			// b--

			expectPlacement(a, { x: 0, y: 0 });
			expectPlacement(b, { x: 0, y: 1 });
		});

		it('should push widgets along the flow axis when a widget is inserted', () => {
			mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });
			const b = mockWidgetPlacement({ x: 1, y: 0, width: 2, height: 1 });
			const c = mockWidgetPlacement({ x: 0, y: 1, width: 3, height: 1 });

			// State:
			// abb
			// ccc

			const d = mockWidgetPlacement({ x: 1, y: 0, width: 1, height: 1 });

			// Expected state:
			// ad-
			// bb-
			// ccc

			expectPlacement(d, { x: 1, y: 0 });
			expectPlacement(b, { x: 0, y: 1 });
			expectPlacement(c, { x: 0, y: 2 });
		});

		it('should append a widget as close to the last widget as it can fit', () => {
			mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });
			mockWidgetPlacement({ x: 1, y: 0, width: 1, height: 1 });

			// State:
			// ab-

			const c = mockWidgetPlacement({ x: 2, y: 0, width: 2, height: 1 });

			// Expected state:
			// ab-
			// cc-

			expectPlacement(c, { x: 0, y: 1 });
		});
	});

	describe('Placement strategy', () => {
		it('should place a widget at the start when empty, no matter the placement strategy', () => {
			const a = mockWidgetPlacement({ width: 2, height: 1 });

			// Expected state:
			// aa-

			expectPlacement(a, { x: 0, y: 0 });

			// Now the same but for prepend
			const prependGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					placementStrategy: 'prepend'
				}
			});

			const b = mockWidgetPlacement({ width: 2, height: 1, grid: prependGrid });

			// Expected state:
			// bb-

			expectPlacement(b, { x: 0, y: 0, grid: prependGrid });
		});

		it('should place a widget at the end on append grid if no coordinates are provided', () => {
			const a = mockWidgetPlacement({ width: 2, height: 1 });
			const b = mockWidgetPlacement({ width: 1, height: 1 });
			const c = mockWidgetPlacement({ width: 2, height: 1 });
			const d = mockWidgetPlacement({ width: 2, height: 1 });

			// Expected state:
			// aab
			// cc-
			// dd-

			expectPlacement(a, { x: 0, y: 0 });
			expectPlacement(b, { x: 2, y: 0 });
			expectPlacement(c, { x: 0, y: 1 });
			expectPlacement(d, { x: 0, y: 2 });
		});

		it('should place a widget at the start on prepend grid if no coordinates are provided', () => {
			const prependGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					placementStrategy: 'prepend'
				}
			});

			const a = mockWidgetPlacement({ width: 2, height: 1, grid: prependGrid });
			const b = mockWidgetPlacement({ width: 1, height: 1, grid: prependGrid });
			const c = mockWidgetPlacement({ width: 2, height: 1, grid: prependGrid });
			const d = mockWidgetPlacement({ width: 2, height: 1, grid: prependGrid });

			// Expected state:
			// dd-
			// ccb
			// aa-

			expectPlacement(d, { x: 0, y: 0, grid: prependGrid });
			expectPlacement(c, { x: 0, y: 1, grid: prependGrid });
			expectPlacement(b, { x: 2, y: 1, grid: prependGrid });
			expectPlacement(a, { x: 0, y: 2, grid: prependGrid });
		});
	});

	describe('Grid expansion', () => {
		it('should not shrink below the minimum rows or column flow when removing widgets', () => {
			const initialRows = grid.rows;
			const initialColumns = grid.columns;

			const a = mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });

			// State:
			// a--
			// ---
			// ---

			grid.removeWidget(a);

			// Expected state:
			// ---
			// ---
			// ---

			expect(grid.rows).toBe(initialRows);
			expect(grid.columns).toBe(initialColumns);
		});

		it('should not shrink below the minimum rows or column flow when adding widgets', () => {
			const initialRows = grid.rows;
			const initialColumns = grid.columns;

			const a = mockWidgetPlacement({ width: 1, height: 1 });
			const b = mockWidgetPlacement({ width: 1, height: 1 });

			// Expected state:
			// ab-
			// ---
			// ---

			expect(grid.rows).toBe(initialRows);
			expect(grid.columns).toBe(initialColumns);
		})
	});

	describe('Widget removal', () => {
		it('should remove a widget from the grid', () => {
			const a = mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });
			const b = mockWidgetPlacement({ x: 1, y: 0, width: 1, height: 1 });

			// State:
			// ab-

			grid.removeWidget(b);

			// State:
			// a--

			expect(grid.widgets).toEqual([a]);
		});

		it('should collapse the grid when a widget is removed', () => {
			mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });
			const b = mockWidgetPlacement({ x: 1, y: 0, width: 2, height: 1 });
			const c = mockWidgetPlacement({ x: 0, y: 1, width: 2, height: 1 });

			// State:
			// abb
			// cc-

			grid.removeWidget(b);

			// Expected state:
			// acc

			expectPlacement(c, { x: 1, y: 0 });
		});

		it('should expand the flow axis when needed, if allowed', () => {
			mockWidgetPlacement({ width: 3, height: 1 });
			mockWidgetPlacement({ width: 3, height: 1 });
			mockWidgetPlacement({ width: 3, height: 1 });

			// State:
			// aaa
			// bbb
			// ccc

			const d = mockWidgetPlacement({ width: 3, height: 1 });

			// Expected state:
			// aaa
			// bbb
			// ccc
			// ddd

			expect(grid.rows).toBe(4);
			expectPlacement(d, { x: 0, y: 3 });
		});

		it('should not expand the flow axis when needed, if expansion is disabled', () => {
			const nonExpandingGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					maxFlowAxis: 3
				}
			});

			mockWidgetPlacement({ width: 3, height: 1, grid: nonExpandingGrid });
			mockWidgetPlacement({ width: 3, height: 1, grid: nonExpandingGrid });
			mockWidgetPlacement({ width: 3, height: 1, grid: nonExpandingGrid });

			// State:
			// aaa
			// bbb
			// ccc

			const d = mockWidgetPlacement({ width: 3, height: 1, grid: nonExpandingGrid, expectedResult: false });

			// Expected state:
			// aaa
			// bbb
			// ccc

			expect(nonExpandingGrid.rows).toBe(3);
		});
	});

	describe('Snapshot and restoration', () => {
		it('should restore a grid from a snapshot', () => {
			const a = mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });
			const b = mockWidgetPlacement({ x: 1, y: 0, width: 1, height: 1 });

			// State:
			// ab-
			// ---
			// ---

			const preSnapshotRows = grid.rows;
			const preSnapshotColumns = grid.columns;

			const snapshot = grid.takeSnapshot();
			grid.clear();

			grid.restoreFromSnapshot(snapshot);

			// Expected state:
			// ab-
			// ---
			// ---

			expectPlacement(a, { x: 0, y: 0 });
			expectPlacement(b, { x: 1, y: 0 });
			expect(grid.rows).toBe(preSnapshotRows);
			expect(grid.columns).toBe(preSnapshotColumns);
		});
	});

	describe('Widget resizing', () => {
		it('should apply the new width when resizing a widget in row flow', () => {
			// Create a widget with width 1
			const widget = createMockWidget(0, 0, 1, 1, true, 1, 3); // minWidth=1, maxWidth=3

			// Place it initially
			const result = grid.tryPlaceWidget(widget, 0, 0, 1, 1);
			expect(result).toBe(true);

			// State:
			// a--
			// ---
			// ---

			expectPlacement(widget, { x: 0, y: 0, width: 1, height: 1 });

			// Now remove and re-add with a larger width (simulating resize)
			grid.removeWidget(widget);

			// Reset the mock to track the new call
			(widget.setBounds as ReturnType<typeof vi.fn>).mockClear();

			// Re-place with width 2
			const resizeResult = grid.tryPlaceWidget(widget, 0, 0, 2, 1);
			expect(resizeResult).toBe(true);

			// State:
			// aa-
			// ---
			// ---

			// The widget should now have width 2
			expectPlacement(widget, { x: 0, y: 0, width: 2, height: 1 });
		});

		it('should apply the new height when resizing a widget in column flow', () => {
			const columnGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					flowAxis: 'column'
				}
			});

			// Create a widget with height 1
			const widget = createMockWidget(0, 0, 1, 1, true, 1, 3, 1, 3); // minHeight=1, maxHeight=3

			// Place it initially
			const result = columnGrid.tryPlaceWidget(widget, 0, 0, 1, 1);
			expect(result).toBe(true);

			// State (column flow):
			// a
			// -
			// -

			expectPlacement(widget, { x: 0, y: 0, width: 1, height: 1 });

			// Now remove and re-add with a larger height (simulating resize)
			columnGrid.removeWidget(widget);

			// Reset the mock to track the new call
			(widget.setBounds as ReturnType<typeof vi.fn>).mockClear();

			// Re-place with height 2
			const resizeResult = columnGrid.tryPlaceWidget(widget, 0, 0, 1, 2);
			expect(resizeResult).toBe(true);

			// State (column flow):
			// a
			// a
			// -

			// The widget should now have height 2
			expectPlacement(widget, { x: 0, y: 0, width: 1, height: 2 });
		});

		it('should push other widgets when resizing causes displacement in row flow', () => {
			const a = mockWidgetPlacement({ x: 0, y: 0, width: 1, height: 1 });
			const b = mockWidgetPlacement({ x: 1, y: 0, width: 1, height: 1 });

			// State:
			// ab-
			// ---
			// ---

			// Remove widget a
			grid.removeWidget(a);

			// Reset mocks
			(a.setBounds as ReturnType<typeof vi.fn>).mockClear();
			(b.setBounds as ReturnType<typeof vi.fn>).mockClear();

			// Re-place widget a with width 2 (this should push b)
			const resizeResult = grid.tryPlaceWidget(a, 0, 0, 2, 1);
			expect(resizeResult).toBe(true);

			// Expected state:
			// aab
			// ---
			// ---

			expectPlacement(a, { x: 0, y: 0, width: 2, height: 1 });
			expectPlacement(b, { x: 2, y: 0, width: 1, height: 1 });
		});

		it('should respect maxWidth constraint when resizing', () => {
			// Create a widget with maxWidth of 2
			const widget = createMockWidget(0, 0, 1, 1, true, 1, 2); // maxWidth=2

			// Place it initially
			grid.tryPlaceWidget(widget, 0, 0, 1, 1);

			// Remove and try to resize beyond maxWidth
			grid.removeWidget(widget);
			(widget.setBounds as ReturnType<typeof vi.fn>).mockClear();

			// Try to place with width 3 (should be constrained to 2)
			grid.tryPlaceWidget(widget, 0, 0, 3, 1);

			// Should be constrained to maxWidth of 2
			expectPlacement(widget, { x: 0, y: 0, width: 2, height: 1 });
		});
	});
});
