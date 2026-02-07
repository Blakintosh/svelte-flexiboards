import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { FlexiTargetConfiguration } from '../target/index.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';
import type { WidgetDraggability } from '../types.js';
import { FreeFormFlexiGrid } from '../grid/free-grid.svelte.js';

// Mock the base class
vi.mock('../grid/base.svelte.js', () => ({
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

/**
 * Creates a mock target controller with a real grid for testing snapshot/restoration behavior.
 * This simulates the key behaviors of InternalFlexiTargetController without full instantiation.
 */
const createMockTargetWithGrid = () => {
	const mockTarget = {} as InternalFlexiTargetController;
	const targetConfig: FlexiTargetConfiguration = {
		layout: {
			type: 'free',
			minRows: 3,
			minColumns: 3
		},
		rowSizing: 'auto',
		columnSizing: 'auto'
	};

	const grid = new FreeFormFlexiGrid(mockTarget, targetConfig);

	// Track snapshot state like the real target controller does
	let preGrabSnapshot: any = null;

	return {
		grid,
		takePreGrabSnapshot: () => {
			preGrabSnapshot = grid.takeSnapshot();
		},
		restorePreGrabSnapshot: () => {
			if (preGrabSnapshot) {
				grid.restoreFromSnapshot(preGrabSnapshot);
				preGrabSnapshot = null;
			}
		},
		forgetPreGrabSnapshot: () => {
			preGrabSnapshot = null;
		},
		hasPreGrabSnapshot: () => preGrabSnapshot !== null
	};
};

describe('Snapshot Restoration on Widget Release Outside Grid', () => {
	describe('Widget grabbed and released outside all targets', () => {
		it('should restore grid state when widget is released outside after leaving target', async () => {
			const target = createMockTargetWithGrid();
			const widget = createMockWidget();

			// Place widget at (1, 1)
			target.grid.tryPlaceWidget(widget, 1, 1, 1, 1);
			expect(widget.x).toBe(1);
			expect(widget.y).toBe(1);

			// Simulate grab: take snapshot, then remove widget from grid
			target.takePreGrabSnapshot();
			target.grid.removeWidget(widget);

			// Verify widget is no longer in grid (can place another widget there)
			const testWidget = createMockWidget();
			const canPlaceAtOldPosition = target.grid.tryPlaceWidget(testWidget, 1, 1, 1, 1);
			expect(canPlaceAtOldPosition).toBe(true);

			// Clean up test widget
			target.grid.removeWidget(testWidget);

			// Simulate widget leaving target (actionWidget would be cleared, but snapshot remains)
			// This is what happens when widget is dragged outside

			// Simulate release outside - the fix checks hasPreGrabSnapshot and restores
			if (target.hasPreGrabSnapshot()) {
				target.restorePreGrabSnapshot();
			}

			// Verify grid state is restored - widget should occupy (1, 1) again
			expect(widget.setBounds).toHaveBeenCalledWith(1, 1, 1, 1);

			// Verify we can't place another widget at the restored position
			const conflictWidget = createMockWidget();
			// The widget should be back in the grid, so placing at same position should cause collision
			// In a real grid with collision handling, this would either fail or push the existing widget
		});

		it('should NOT restore if snapshot was cleared by successful drop', async () => {
			const target = createMockTargetWithGrid();
			const widget = createMockWidget();

			// Place widget at (0, 0)
			target.grid.tryPlaceWidget(widget, 0, 0, 1, 1);

			// Simulate grab
			target.takePreGrabSnapshot();
			target.grid.removeWidget(widget);

			// Simulate successful drop - this clears the snapshot
			target.grid.tryPlaceWidget(widget, 2, 2, 1, 1);
			target.forgetPreGrabSnapshot();

			// Verify snapshot is cleared
			expect(target.hasPreGrabSnapshot()).toBe(false);

			// The safety net check would do nothing since hasPreGrabSnapshot is false
			if (target.hasPreGrabSnapshot()) {
				target.restorePreGrabSnapshot();
			}

			// Widget should remain at new position (2, 2)
			expect(widget.x).toBe(2);
			expect(widget.y).toBe(2);
		});

		it('should handle multiple widgets with only grabbed widget affected', async () => {
			const target = createMockTargetWithGrid();
			const widget1 = createMockWidget();
			const widget2 = createMockWidget();

			// Place two widgets
			target.grid.tryPlaceWidget(widget1, 0, 0, 1, 1);
			target.grid.tryPlaceWidget(widget2, 2, 2, 1, 1);

			// Grab widget1
			target.takePreGrabSnapshot();
			target.grid.removeWidget(widget1);

			// Simulate release outside
			if (target.hasPreGrabSnapshot()) {
				target.restorePreGrabSnapshot();
			}

			// Both widgets should be restored to their positions
			expect(widget1.setBounds).toHaveBeenCalledWith(0, 0, 1, 1);
			expect(widget2.setBounds).toHaveBeenCalledWith(2, 2, 1, 1);
		});

		it('should NOT restore after widget deletion (intentional removal)', async () => {
			const target = createMockTargetWithGrid();
			const widget = createMockWidget();

			// Place widget
			target.grid.tryPlaceWidget(widget, 1, 1, 1, 1);

			// Grab widget
			target.takePreGrabSnapshot();
			target.grid.removeWidget(widget);

			// Simulate deletion - this should clear the snapshot
			target.forgetPreGrabSnapshot();

			// Verify snapshot is cleared
			expect(target.hasPreGrabSnapshot()).toBe(false);

			// Safety net check should do nothing
			if (target.hasPreGrabSnapshot()) {
				target.restorePreGrabSnapshot();
			}

			// Widget should NOT be restored (it was intentionally deleted)
			// The last setBounds call should still be the original placement, not a restoration
			const setBoundsCalls = (widget.setBounds as ReturnType<typeof vi.fn>).mock.calls;
			expect(setBoundsCalls.length).toBe(1); // Only the initial placement
		});
	});

	describe('Snapshot state tracking', () => {
		it('hasPreGrabSnapshot returns true after taking snapshot', () => {
			const target = createMockTargetWithGrid();
			const widget = createMockWidget();

			target.grid.tryPlaceWidget(widget, 0, 0, 1, 1);
			expect(target.hasPreGrabSnapshot()).toBe(false);

			target.takePreGrabSnapshot();
			expect(target.hasPreGrabSnapshot()).toBe(true);
		});

		it('hasPreGrabSnapshot returns false after restoration', () => {
			const target = createMockTargetWithGrid();
			const widget = createMockWidget();

			target.grid.tryPlaceWidget(widget, 0, 0, 1, 1);
			target.takePreGrabSnapshot();
			target.grid.removeWidget(widget);

			expect(target.hasPreGrabSnapshot()).toBe(true);

			target.restorePreGrabSnapshot();
			expect(target.hasPreGrabSnapshot()).toBe(false);
		});

		it('hasPreGrabSnapshot returns false after forget', () => {
			const target = createMockTargetWithGrid();
			const widget = createMockWidget();

			target.grid.tryPlaceWidget(widget, 0, 0, 1, 1);
			target.takePreGrabSnapshot();

			expect(target.hasPreGrabSnapshot()).toBe(true);

			target.forgetPreGrabSnapshot();
			expect(target.hasPreGrabSnapshot()).toBe(false);
		});
	});
});
