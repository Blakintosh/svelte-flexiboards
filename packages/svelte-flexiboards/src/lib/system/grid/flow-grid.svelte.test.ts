import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';
import type { FlexiTargetConfiguration } from '../target/index.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
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

	describe('mapRawCellToFinalCell with drag snapshot', () => {
		const createShadowWidget = (x = 0, y = 0, width = 1, height = 1): InternalFlexiWidgetController => {
			const widget = createMockWidget(x, y, width, height);
			(widget as any).isShadow = true;
			return widget;
		};

		it('should return normalized position when no drag snapshot is set', () => {
			// No snapshot set, so mapRawCellToFinalCell should just pass through
			const result = grid.mapRawCellToFinalCell(1, 0);
			expect(result).toEqual([1, 0]);
		});

		it('should map cursor on first half of widget to before-position in snapshot', () => {
			// Set up: 3-column grid with widget A(1-wide) at position 0
			const a = createMockWidget(0, 0, 1, 1);
			grid.tryPlaceWidget(a, 0, 0, 1, 1);

			// Take a snapshot (A is at position 0)
			const snapshot = grid.takeSnapshot();

			// Now simulate a shadow (2-wide) being placed at position 0, displacing A to position 2
			const shadow = createShadowWidget(0, 0, 2, 1);
			grid.tryPlaceWidget(shadow, 0, 0, 2, 1);

			// A should now be at position 2 in the live grid
			expect(a.x).toBe(2);
			expect(a.y).toBe(0);

			// Set the drag snapshot
			grid.setDragSnapshot(snapshot);

			// Cursor at (2, 0) — on A in the live grid. A is 1-wide, so midpoint is 2.5.
			// position1D (2) < midpoint (2.5) → "before" → returns A's snapshot position (0, 0).
			const result = grid.mapRawCellToFinalCell(2, 0);
			expect(result).toEqual([0, 0]);
		});

		it('should map cursor past widget midpoint to after-position in snapshot', () => {
			// Set up: 3-column grid with widget A(2-wide) at position 0
			const a = createMockWidget(0, 0, 2, 1);
			grid.tryPlaceWidget(a, 0, 0, 2, 1);

			const snapshot = grid.takeSnapshot();

			// Shadow (1-wide) placed at position 0 pushes A to position 1
			const shadow = createShadowWidget(0, 0, 1, 1);
			grid.tryPlaceWidget(shadow, 0, 0, 1, 1);

			expect(a.x).toBe(1);
			expect(a.y).toBe(0);

			grid.setDragSnapshot(snapshot);

			// Cursor at (2, 0) → 1D pos 2. A is at live pos 1, width 2, midpoint = 1 + 1 = 2.
			// position1D (2) < midpoint (2) → false → "after"
			// A in snapshot is at (0,0) width 2, so after = 0 + 2 = 2 → (2, 0).
			const result = grid.mapRawCellToFinalCell(2, 0);
			expect(result).toEqual([2, 0]);
		});

		it('should map cursor over shadow to nearest non-shadow using midpoint logic', () => {
			// Set up: 3-column grid with widget A(1-wide) at position 0
			const a = createMockWidget(0, 0, 1, 1);
			grid.tryPlaceWidget(a, 0, 0, 1, 1);

			const snapshot = grid.takeSnapshot();

			// Shadow (2-wide) placed at position 0 pushes A to position 2
			const shadow = createShadowWidget(0, 0, 2, 1);
			grid.tryPlaceWidget(shadow, 0, 0, 2, 1);

			grid.setDragSnapshot(snapshot);

			// Cursor at (1, 0) → 1D pos 1, over the shadow.
			// Nearest non-shadow neighbor is A at live pos 2, midpoint 2.5.
			// 1 < 2.5 → "before" → returns A's snapshot position (0, 0).
			const result = grid.mapRawCellToFinalCell(1, 0);
			expect(result).toEqual([0, 0]);
		});

		it('should map correctly in multi-column grid without crossing row boundaries', () => {
			// 3-column grid with A(1-wide) at position 0, B(1-wide) at position 1
			const a = createMockWidget(0, 0, 1, 1);
			grid.tryPlaceWidget(a, 0, 0, 1, 1);

			const b = createMockWidget(1, 0, 1, 1);
			grid.tryPlaceWidget(b, 1, 0, 1, 1);

			// Snapshot: A at (0,0) width 1, B at (1,0) width 1
			const snapshot = grid.takeSnapshot();

			// Shadow (2-wide) placed at position 0 pushes A to (2,0) and B wraps to (0,1)
			const shadow = createShadowWidget(0, 0, 2, 1);
			grid.tryPlaceWidget(shadow, 0, 0, 2, 1);

			expect(a.x).toBe(2);
			expect(a.y).toBe(0);
			expect(b.x).toBe(0);
			expect(b.y).toBe(1);

			grid.setDragSnapshot(snapshot);

			// Cursor at (0, 1) → 1D pos 3, over B in the live grid.
			// B is 1-wide at live pos 3, midpoint = 3.5.
			// position1D (3) < midpoint (3.5) → "before" → returns B's snapshot position (1, 0).
			// This is the key: without snapshot-based mapping, a 1D subtraction would have produced
			// an incorrect result that crosses row boundaries in multi-column layouts.
			const result = grid.mapRawCellToFinalCell(0, 1);
			expect(result).toEqual([1, 0]);
		});

		it('should allow placing before first widget in 1-column grid', () => {
			// 1-column, 3-row grid — simulates mobile/narrow view
			const narrowGrid = new FlowFlexiGrid(mockTarget, {
				...targetConfig,
				layout: {
					...(targetConfig.layout as FlowTargetLayout),
					columns: 1,
					rows: 3
				}
			});

			const a = createMockWidget(0, 0, 1, 1);
			narrowGrid.tryPlaceWidget(a, 0, 0, 1, 1);
			const b = createMockWidget(0, 1, 1, 1);
			narrowGrid.tryPlaceWidget(b, 0, 1, 1, 1);

			// Snapshot: A(0,0), B(0,1)
			const snapshot = narrowGrid.takeSnapshot();

			// Place shadow at (0,1) — pushes B to (0,2)
			const shadow = createShadowWidget(0, 0, 1, 1);
			narrowGrid.tryPlaceWidget(shadow, 0, 1, 1, 1);

			expect(shadow.x).toBe(0);
			expect(shadow.y).toBe(1);
			expect(b.x).toBe(0);
			expect(b.y).toBe(2);

			narrowGrid.setDragSnapshot(snapshot);

			// Cursor at (0.6, 0.2) — in the first cell, past x midpoint but clearly in the
			// top portion of the first row. In a 1-col grid, x should be irrelevant.
			// Should map to (0, 0) = before A in the snapshot.
			const result = narrowGrid.mapRawCellToFinalCell(0.6, 0.2);
			expect(result).toEqual([0, 0]);
		});

		it('should clear the drag snapshot', () => {
			const a = createMockWidget(0, 0, 1, 1);
			grid.tryPlaceWidget(a, 0, 0, 1, 1);

			const snapshot = grid.takeSnapshot();
			grid.setDragSnapshot(snapshot);

			// Clear it
			grid.clearDragSnapshot();

			// Now should behave as passthrough
			const result = grid.mapRawCellToFinalCell(1, 0);
			expect(result).toEqual([1, 0]);
		});
	});
});
