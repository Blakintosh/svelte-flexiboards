import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlexiGrid } from './base.svelte.js';
import { FreeFormFlexiGrid } from './free-grid.svelte.js';
import type { FlexiWidgetController } from '../widget.svelte';
import type { FlexiTargetConfiguration, InternalFlexiTargetController } from '../target.svelte';

// TODO - for some reason the test suite can't figure out that the FlexiGrid class is available, so this is a hack to fix it
vi.mock('./base.svelte.js', () => ({
	FlexiGrid: class FlexiGrid {
		constructor() {}
		// Mock any methods used in the test
	}
}));

describe('FreeFormFlexiGrid', () => {
	let grid: FreeFormFlexiGrid;
	let nonExpandingGrid: FreeFormFlexiGrid;
	let mockTarget: InternalFlexiTargetController;
	let targetConfig: FlexiTargetConfiguration;

	const createMockWidget = (
		x = 0,
		y = 0,
		width = 1,
		height = 1,
		draggable = true
	): FlexiWidgetController => {
		const widget = {
			x,
			y,
			width,
			height,
			draggable,
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

	beforeEach(() => {
		mockTarget = {} as InternalFlexiTargetController;
		targetConfig = {
			layout: {
				type: 'free',
				minRows: 3,
				minColumns: 3
			},
			rowSizing: 'auto',
			columnSizing: 'auto'
		};

		grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
		nonExpandingGrid = new FreeFormFlexiGrid(mockTarget, {
			...targetConfig,
			layout: {
				type: 'free',
				minRows: 3,
				minColumns: 3,
				maxRows: 3,
				maxColumns: 3
			}
		});
	});

	describe('Basic widget placement', () => {
		it('should place a widget at a specific coordinate', () => {
			const widget = createMockWidget();

			const result = grid.tryPlaceWidget(widget, 1, 2, 1, 1);

			expect(result).toBe(true);
			expect(widget.setBounds).toHaveBeenCalledWith(1, 2, 1, 1);
		});

		it('should place widgets with different sizes', () => {
			const widget = createMockWidget();

			const result = grid.tryPlaceWidget(widget, 1, 1, 2, 3);

			expect(result).toBe(true);
			expect(widget.setBounds).toHaveBeenCalledWith(1, 1, 2, 3);
		});

		it('should place a widget at grid boundaries', () => {
			const widget = createMockWidget();

			const result = grid.tryPlaceWidget(widget, 2, 2, 1, 1);

			expect(result).toBe(true);
			expect(widget.setBounds).toHaveBeenCalledWith(2, 2, 1, 1);
		});
	});

	describe('Collision handling', () => {
		it('should resolve collisions by moving widgets in X direction first', () => {
			const widget1 = createMockWidget();
			const widget2 = createMockWidget();

			grid.tryPlaceWidget(widget1, 1, 1, 2, 2);

			// State:
			// ---
			// -aa
			// -aa

			const result = grid.tryPlaceWidget(widget2, 1, 1, 1, 1);

			// Expected state:
			// ----
			// -baa
			// --aa

			expect(result).toBe(true);
			// To resolve collision - should have been pushed 1 unit to the right
			expect(widget1.setBounds).toHaveBeenCalledWith(2, 1, widget1.width, widget1.height);
		});

		it('should resolve collisions by moving widgets in Y direction when X fails', () => {
			// First place a widget at (0,1) with width 2, height 2
			const widget1 = createMockWidget();
			nonExpandingGrid.tryPlaceWidget(widget1, 0, 0, 2, 2);

			// Place another widget at (2,1) to block X-movement for widget1
			const widget2 = createMockWidget();
			nonExpandingGrid.tryPlaceWidget(widget2, 2, 0, 1, 1);

			// State:
			// aab
			// aa-
			// ---

			// Now try to place a widget at (0,1) which should force widget1 down
			const widget3 = createMockWidget();
			const result = nonExpandingGrid.tryPlaceWidget(widget3, 0, 0, 2, 1);

			// Expected state:
			// ccb
			// aa-
			// aa-

			expect(result).toBe(true);
			expect(widget1.setBounds).toHaveBeenCalledWith(0, 1, widget1.width, widget1.height);
		});

		it('should fail when colliding with a non-draggable widget', () => {
			// Create a non-draggable widget at (1,1)
			const widget1 = createMockWidget(0, 0, 0, 0, false);
			grid.tryPlaceWidget(widget1, 1, 1, 2, 2);

			// State:
			// ---
			// -AA
			// -AA

			// Try to place another widget at the same position
			const widget2 = createMockWidget();
			const result = grid.tryPlaceWidget(widget2, 1, 1, 1, 1);

			// Expected state:
			// ---
			// -AA
			// -AA

			expect(result).toBe(false);
		});
	});

	describe('Grid expansion', () => {
		it('should expand columns when placing outside grid boundaries', () => {
			const widget = createMockWidget();

			const result = grid.tryPlaceWidget(widget, 4, 1, 3, 1);

			expect(result).toBe(true);
			expect(grid.columns).toBeGreaterThan(3);
		});

		it('should expand rows when placing outside grid boundaries', () => {
			const widget = createMockWidget();

			const result = grid.tryPlaceWidget(widget, 1, 4, 1, 3);

			expect(result).toBe(true);
			expect(grid.rows).toBeGreaterThan(3);
		});

		it('should not expand when expansion is disabled', () => {
			const widget = createMockWidget();

			const result = nonExpandingGrid.tryPlaceWidget(widget, 2, 1, 2, 2);

			expect(result).toBe(false);
		});

		it('should not expand beyond MAX_COLUMNS', () => {
			// Create a widget that would exceed MAX_COLUMNS (32)
			const widget = createMockWidget();

			// Using a very wide widget to attempt to exceed MAX_COLUMNS
			const result = grid.tryPlaceWidget(widget, 1, 1, 33, 1);

			expect(result).toBe(false);
		});
	});

	describe('Widget removal', () => {
		it('should remove a widget from the grid', () => {
			const widget = createMockWidget();
			grid.tryPlaceWidget(widget, 1, 1, 2, 2);

			// State:
			// ---
			// -aa
			// -aa

			const result = grid.removeWidget(widget);

			expect(result).toBe(true);

			// Expected state:
			// ---
			// ---
			// ---

			// Now we should be able to place another widget in the same location
			const widget2 = createMockWidget();
			const placeResult = grid.tryPlaceWidget(widget2, 1, 1, 2, 2);

			// State:
			// ---
			// -bb
			// -bb

			expect(placeResult).toBe(true);
		});
	});

	describe('Snapshot and restoration', () => {
		it('should take a snapshot and restore from it', () => {
			// Place a few widgets
			const widget1 = createMockWidget();
			const widget2 = createMockWidget();

			const [x1, y1, w1, h1] = [0, 0, 2, 2];
			const [x2, y2, w2, h2] = [2, 2, 1, 1];

			grid.tryPlaceWidget(widget1, x1, y1, w1, h1);
			grid.tryPlaceWidget(widget2, x2, y2, w2, h2);

			// State:
			// aa-
			// aa-
			// --b

			// Take a snapshot
			const snapshot = grid.takeSnapshot();

			// Clear the grid
			grid.clear();

			// Place a new widget.
			const widget3 = createMockWidget();
			grid.tryPlaceWidget(widget3, 1, 1, 1, 1);

			// State:
			// ---
			// -c-
			// ---

			// Restore from snapshot
			grid.restoreFromSnapshot(snapshot);

			// Expected state:
			// aa-
			// aa-
			// --b

			// Verify widgets were restored with correct position
			expect(widget1.setBounds).toHaveBeenCalledWith(x1, y1, w1, h1);
			expect(widget2.setBounds).toHaveBeenCalledWith(x2, y2, w2, h2);
		});
	});

	describe('Edge cases', () => {
		it('should handle placing at (0,0)', () => {
			const widget = createMockWidget();

			const result = grid.tryPlaceWidget(widget, 0, 0, 1, 1);

			// Expected state:
			// a--
			// ---
			// ---

			expect(result).toBe(true);
			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 1, 1);
		});

		it('should handle moving widgets by different amounts', () => {
			// Create a grid with widgets that form a specific pattern
			const widget1 = createMockWidget();
			const widget2 = createMockWidget();
			const widget3 = createMockWidget();

			grid.tryPlaceWidget(widget1, 1, 0, 1, 1);
			grid.tryPlaceWidget(widget2, 0, 1, 1, 2);
			grid.tryPlaceWidget(widget3, 2, 2, 1, 1);

			// State:
			// -a-
			// b--
			// b-c

			const widget4 = createMockWidget();

			// This should cause a cascade of moves, by differing amounts.
			const result = grid.tryPlaceWidget(widget4, 0, 0, 2, 2);

			// Expected state:
			// dda-
			// ddb-
			// --bc

			expect(result).toBe(true);
			expect(widget1.setBounds).toHaveBeenCalledWith(2, 0, widget1.width, widget1.height);
			expect(widget2.setBounds).toHaveBeenCalledWith(2, 1, widget2.width, widget2.height);
			expect(widget3.setBounds).toHaveBeenCalledWith(3, 2, widget3.width, widget3.height);
		});

		it('should maintain correct bitmaps when a full row is manipulated (issue #9)', () => {
			const widget1 = createMockWidget();
			const widget2 = createMockWidget();
			const widget3 = createMockWidget();
			const widget4 = createMockWidget();
			const widget5 = createMockWidget();

			// Place these along the first row to fill it
			nonExpandingGrid.tryPlaceWidget(widget1, 0, 1, 1, 1);
			nonExpandingGrid.tryPlaceWidget(widget2, 1, 1, 1, 1);
			nonExpandingGrid.tryPlaceWidget(widget3, 2, 1, 1, 1);

			// State:
			// abc
			// ---
			// ---

			// Now taking widget2's place should move widget2 down
			nonExpandingGrid.tryPlaceWidget(widget4, 1, 1, 1, 1);

			// Expected state:
			// adc
			// -b-
			// ---

			// Finally, placing widget5 where widget3 is should move widget3 down
			nonExpandingGrid.tryPlaceWidget(widget5, 2, 1, 1, 1);

			// Expected state:
			// ade
			// -bc
			// ---

			// Check that widget2 was moved down
			expect(widget2.setBounds).toHaveBeenCalledWith(1, 2, 1, 1);
			// and that widget3 was moved down (one bug we found was the grid "forgot" widget3 was here, so didn't register a collision)
			expect(widget3.setBounds).toHaveBeenCalledWith(2, 2, 1, 1);
		});
	});
});
