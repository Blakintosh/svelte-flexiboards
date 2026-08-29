import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { InternalFlexiWidgetController } from '../widget/controller.js';
import type { FlexiTargetConfiguration } from '../target/types.js';
import type { InternalFlexiTargetController } from '../target/controller.js';
import { FlowFlexiGrid, type FlowTargetLayout } from './flow-grid.js';

// TODO - for some reason the test suite can't figure out that the FlexiGrid class is available, so this is a hack to fix it
vi.mock('./base.js', () => ({
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
	): InternalFlexiWidgetController => {
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

		return widget as unknown as InternalFlexiWidgetController;
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

	const expectPlacement = (widget: InternalFlexiWidgetController, placement: Placement) => {
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
		});
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

			const d = mockWidgetPlacement({
				width: 3,
				height: 1,
				grid: nonExpandingGrid,
				expectedResult: false
			});

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

	describe('Drag and drop with snapshot restoration', () => {
		it('should compact widgets when shadow moves from front to back', () => {
			// This tests the scenario:
			// 1. Initial: 1x1 at position 0, 2x1 at position 1-2
			// 2. User grabs 2x1, places shadow in front of 1x1 (displacing it)
			// 3. User then moves shadow behind 1x1
			// Expected: 1x1 should return to position 0, shadow at position 1-2

			// Use a 4-column grid for clarity
			const wideGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					columns: 4,
					rows: 3
				}
			});

			// Initial state: 1x1 at position 0
			const widget1x1 = createMockWidget(0, 0, 1, 1);
			wideGrid.tryPlaceWidget(widget1x1, 0, 0, 1, 1);

			// State: [1x1@0]
			expect(widget1x1.x).toBe(0);
			expect(widget1x1.y).toBe(0);

			// Simulate grabbing a 2x1 widget (remove it, take snapshot)
			// In this case, we'll just take the snapshot with 1x1 in place
			const snapshot = wideGrid.takeSnapshot();

			// Create a shadow widget (2-wide)
			const shadow = createMockWidget(0, 0, 2, 1);

			// Place shadow in front of 1x1 (at position 0)
			wideGrid.tryPlaceWidget(shadow, 0, 0, 2, 1);

			// After placing shadow at 0, 1x1 should be displaced to position 2
			expect(shadow.x).toBe(0);
			expect(shadow.y).toBe(0);
			expect(widget1x1.x).toBe(2); // Displaced to position 2
			expect(widget1x1.y).toBe(0);

			// Now simulate moving the shadow behind 1x1
			// First, remove shadow and restore from snapshot
			wideGrid.removeWidget(shadow);
			wideGrid.restoreFromSnapshot(snapshot);

			// After restoration, 1x1 should be back at position 0
			expect(widget1x1.x).toBe(0);
			expect(widget1x1.y).toBe(0);

			// Reset mock to track new placement
			(shadow.setBounds as ReturnType<typeof vi.fn>).mockClear();

			// Place shadow at position behind 1x1 (position 1)
			wideGrid.tryPlaceWidget(shadow, 1, 0, 2, 1);

			// Shadow should be at position 1-2, 1x1 stays at position 0
			expect(shadow.x).toBe(1);
			expect(shadow.y).toBe(0);
			expect(widget1x1.x).toBe(0); // 1x1 should still be at position 0!
			expect(widget1x1.y).toBe(0);
		});

		it('should not leave gaps when moving shadow from front to back in a crowded grid', () => {
			// Use a 3-column grid
			// Initial: a at 0, shadow at 1-2
			// Move shadow to position 3 (behind a)
			// Expected: a at 0, shadow at 1-2 (compacted)

			// Create a fresh 3-column grid
			const smallGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					columns: 3,
					rows: 3
				}
			});

			// Place 1x1 widget
			const a = createMockWidget(0, 0, 1, 1);
			smallGrid.tryPlaceWidget(a, 0, 0, 1, 1);
			expect(a.x).toBe(0);
			expect(a.y).toBe(0);

			// Take snapshot (this is what happens when we start dragging)
			const snapshot = smallGrid.takeSnapshot();

			// Place shadow at position 0 (in front of a)
			const shadow = createMockWidget(0, 0, 2, 1);
			smallGrid.tryPlaceWidget(shadow, 0, 0, 2, 1);

			// a should be displaced
			expect(shadow.x).toBe(0);
			expect(a.x).toBe(2); // Displaced to position 2

			// Now user moves shadow to position after a (say, position 3)
			// Remove shadow and restore
			smallGrid.removeWidget(shadow);
			smallGrid.restoreFromSnapshot(snapshot);

			// a should be back at 0
			expect(a.x).toBe(0);
			expect(a.y).toBe(0);

			// Place shadow at position 3 (user hovering there thinking it's behind a@2)
			// The flow grid should compact it to position 1 (right after a)
			(shadow.setBounds as ReturnType<typeof vi.fn>).mockClear();
			smallGrid.tryPlaceWidget(shadow, 0, 1, 2, 1); // (0, 1) = position 3 in 3-col grid

			// Shadow should be compacted to position 1 (adjacent to a)
			expect(shadow.x).toBe(1);
			expect(shadow.y).toBe(0);

			// a should still be at position 0
			expect(a.x).toBe(0);
			expect(a.y).toBe(0);
		});

		it('should fill gaps when removing a widget that left a gap before it', () => {
			// This is the exact repro from the user:
			// Grid with 3 columns:
			// - 2x1 widget A at positions 0-1 (row 0)
			// - 2x1 widget B can't fit at position 2, so goes to position 3-4 (row 1)
			// - 1x1 widget C at position 5 (row 1)
			//
			// State:
			// AA-   (row 0: A at 0-1, gap at 2)
			// BBC   (row 1: B at 0-1, C at 2)
			//
			// When B is removed, C should move to position 2 (the gap after A),
			// NOT to position 3 (where B was).

			// Place widgets
			const a = mockWidgetPlacement({ width: 2, height: 1 });
			const b = mockWidgetPlacement({ width: 2, height: 1 });
			const c = mockWidgetPlacement({ width: 1, height: 1 });

			// Verify initial state
			// A at (0, 0) = position 0-1
			expect(a.x).toBe(0);
			expect(a.y).toBe(0);

			// B can't fit at position 2, wraps to position 3 = (0, 1)
			expect(b.x).toBe(0);
			expect(b.y).toBe(1);

			// C at position 5 = (2, 1)
			expect(c.x).toBe(2);
			expect(c.y).toBe(1);

			// Now remove B
			grid.removeWidget(b);

			// C should move to position 2 = (2, 0) to fill the gap after A
			// NOT to position 3 = (0, 1) where B was
			expect(c.x).toBe(2);
			expect(c.y).toBe(0);
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

	describe('mapRawCellToFinalCell without a drag snapshot', () => {
		it('floors to the hovered cell', () => {
			expect(grid.mapRawCellToFinalCell(1.6, 0.4)).toEqual([1, 0]);
		});

		it('behaves as passthrough again once the drag snapshot is cleared', () => {
			mockWidgetPlacement({ x: 0, y: 0 });
			grid.setDragSnapshot(grid.takeSnapshot());
			grid.clearDragSnapshot();
			expect(grid.mapRawCellToFinalCell(1, 0)).toEqual([1, 0]);
		});
	});

	describe('insert resolution', () => {
		const makeGrid = () => new FlowFlexiGrid(mockTarget, targetConfig);

		/**
		 * Simulates a same-target drag: the grid held [A, X, B, C], X was grabbed (removed), leaving
		 * A(0) B(1) C(2) in a 3-column row. X's origin was cell (1, 0).
		 */
		const setupSameTargetDrag = (cellGrid: FlowFlexiGrid) => {
			const a = mockWidgetPlacement({ grid: cellGrid, x: 0, y: 0 });
			const b = mockWidgetPlacement({ grid: cellGrid, x: 1, y: 0 });
			const c = mockWidgetPlacement({ grid: cellGrid, x: 2, y: 0 });
			cellGrid.setDragSnapshot(cellGrid.takeSnapshot(), { x: 1, y: 0 });
			return { a, b, c };
		};

		it.each<[[number, number], [number, number], string]>([
			// [hover, expected, why]
			[[0, 0], [0, 0], 'A is before the origin → drop before A'],
			[[1, 0], [2, 0], 'B shifted into the origin slot → was after → drop after B'],
			[[2, 0], [0, 1], 'C is after the origin → drop after C (wraps to next row)'],
			[[1, 1], [0, 1], 'empty space → end of the snapshot'],
			[[1.9, 0.9], [2, 0], 'fractional coordinates floor to the hovered cell'],
			[[2.7, 0.8], [0, 1], 'last column: no wrap to the next row from the bottom half']
		])('hover %j → %j (%s)', (hover, expected) => {
			const cellGrid = makeGrid();
			setupSameTargetDrag(cellGrid);
			expect(cellGrid.mapRawCellToFinalCell(hover[0], hover[1])).toEqual(expected);
		});

		it('drops before the hovered widget when dragging from another target (no origin)', () => {
			const cellGrid = makeGrid();
			mockWidgetPlacement({ grid: cellGrid, x: 0, y: 0 });
			mockWidgetPlacement({ grid: cellGrid, x: 1, y: 0 });
			cellGrid.setDragSnapshot(cellGrid.takeSnapshot(), null);

			expect(cellGrid.mapRawCellToFinalCell(1, 0)).toEqual([1, 0]);
		});

		it.each<[number, [number, number], [number, number], string]>([
			[0, [1, 0], [1, 0], 'shadow at 0: A (live 1) is past it → after A = the original slot'],
			[0, [2, 0], [2, 0], 'shadow at 0: B (live 2) is past it → after B'],
			[3, [2, 0], [2, 0], 'shadow at 3: C (live 2) is before it → before C'],
			[3, [0, 0], [0, 0], 'shadow at 3: A (live 0) is before it → before A']
		])(
			'direction is relative to the shadow (shadow@%s, hover %j → %j: %s)',
			(shadowAt, hover, expected) => {
				const cellGrid = makeGrid();
				setupSameTargetDrag(cellGrid);
				const shadow = createMockWidget(0, 0, 1, 1);
				(shadow as any).isShadow = true;
				cellGrid.tryPlaceWidget(shadow, shadowAt % 3, Math.floor(shadowAt / 3), 1, 1);
				expect(cellGrid.mapRawCellToFinalCell(hover[0], hover[1])).toEqual(expected);
			}
		);

		describe('direction hysteresis on the same widget', () => {
			/** 1-column list: A(0) B(1) C(2); dragged came from between A and B; shadow placed after C. */
			const setupList = () => {
				const list = new FlowFlexiGrid(mockTarget, {
					...targetConfig,
					layout: {
						type: 'flow',
						flowAxis: 'row',
						placementStrategy: 'append',
						rows: 4,
						columns: 1
					}
				});
				mockWidgetPlacement({ grid: list, x: 0, y: 0 });
				mockWidgetPlacement({ grid: list, x: 0, y: 1 });
				mockWidgetPlacement({ grid: list, x: 0, y: 2 });
				list.setDragSnapshot(list.takeSnapshot(), { x: 0, y: 1 });
				const shadow = createMockWidget(0, 3, 1, 1);
				(shadow as any).isShadow = true;
				list.tryPlaceWidget(shadow, 0, 3, 1, 1);
				return list;
			};
			const setDelta = (g: FlowFlexiGrid, x: number, y: number) =>
				((g as any)._pointerDelta = { x, y });

			it('does not flip sides on the same widget without pointer travel in that direction', () => {
				const list = setupList();
				// Hover C (live row 2, before the shadow at row 3) → before C.
				expect(list.mapRawCellToFinalCell(0, 2)).toEqual([0, 2]);
				// Simulate C reflowing under the pointer to after the shadow: shadow now at 2, C at 3.
				const c = list.widgets[2];
				const shadow = list.widgets[3];
				list.removeWidget(shadow);
				list.tryPlaceWidget(shadow, 0, 2, 1, 1);
				expect(c.y).toBe(3);
				// Pointer hasn't moved down (sideways only, single column) → hold "before C".
				setDelta(list, 5, 0);
				expect(list.mapRawCellToFinalCell(0, 3)).toEqual([0, 2]);
				// Pointer genuinely moves down → accept "after C".
				setDelta(list, 0, 3);
				expect(list.mapRawCellToFinalCell(0, 3)).toEqual([0, 3]);
			});

			it('flips freely when a different widget is hovered', () => {
				const list = setupList();
				expect(list.mapRawCellToFinalCell(0, 2)).toEqual([0, 2]); // before C
				setDelta(list, 0, 0);
				expect(list.mapRawCellToFinalCell(0, 0)).toEqual([0, 0]); // before A, new widget
			});
		});

		it('holds the last resolved slot while hovering the shadow', () => {
			const cellGrid = makeGrid();
			setupSameTargetDrag(cellGrid);

			// Shadow lands at 0, displacing A→1, B→2, C→3.
			const shadow = createMockWidget(0, 0, 1, 1);
			(shadow as any).isShadow = true;
			cellGrid.tryPlaceWidget(shadow, 0, 0, 1, 1);

			expect(cellGrid.mapRawCellToFinalCell(2, 0)).toEqual([2, 0]); // B → after B
			expect(cellGrid.mapRawCellToFinalCell(0, 0)).toEqual([2, 0]); // shadow → unchanged
		});

		it('both halves of a tile resolve identically (no midpoint quantisation)', () => {
			const cellGrid = makeGrid();
			setupSameTargetDrag(cellGrid);
			expect(cellGrid.mapRawCellToFinalCell(1.1, 0)).toEqual(
				cellGrid.mapRawCellToFinalCell(1.9, 0)
			);
		});

		it('resets held state when the drag snapshot is cleared', () => {
			const cellGrid = makeGrid();
			setupSameTargetDrag(cellGrid);
			cellGrid.mapRawCellToFinalCell(2, 0);
			cellGrid.clearDragSnapshot();
			expect(cellGrid.mapRawCellToFinalCell(0.5, 0.5)).toEqual([0, 0]);
		});
	});
});
