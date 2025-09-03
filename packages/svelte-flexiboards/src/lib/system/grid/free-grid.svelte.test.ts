import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlexiGrid } from './base.svelte.js';
import { FreeFormFlexiGrid } from './free-grid.svelte.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';
import type { FlexiTargetConfiguration } from '../target/index.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';
import type { WidgetDraggability } from '../types.js';

// TODO - for some reason the test suite can't figure out that the FlexiGrid class is available, so this is a hack to fix it
vi.mock('./base.svelte.js', () => ({
	FlexiGrid: class FlexiGrid {
		constructor() {}
		// Mock any methods used in the test
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

describe('FreeFormFlexiGrid', () => {
	describe('Expandable Grid (default behavior)', () => {
		let grid: FreeFormFlexiGrid;
		let mockTarget: InternalFlexiTargetController;

		beforeEach(() => {
			mockTarget = {} as InternalFlexiTargetController;
			const targetConfig: FlexiTargetConfiguration = {
				layout: {
					type: 'free',
					minRows: 3,
					minColumns: 3,
				},
				rowSizing: 'auto',
				columnSizing: 'auto'
			};
			grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
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

			it('should fail when colliding with a non-draggable widget', () => {
				// Create a non-draggable widget at (1,1)
				const widget1 = createMockWidget({ x: 0, y: 0, width: 0, height: 0, draggability: 'none' });
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
		});

		describe('Grid expansion', () => {
			it('should expand columns when placing outside grid boundaries', () => {
				const widget = createMockWidget();

				const result = grid.tryPlaceWidget(widget, 4, 1, 3, 1);

				expect(result).toBe(true);
				expect(grid.columns).toBeGreaterThan(3);
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
	});

	describe('Fixed Size Grid (no expansion)', () => {
		let grid: FreeFormFlexiGrid;
		let mockTarget: InternalFlexiTargetController;

		beforeEach(() => {
			mockTarget = {} as InternalFlexiTargetController;
			const targetConfig: FlexiTargetConfiguration = {
				layout: {
					type: 'free',
					minRows: 3,
					minColumns: 3,
					maxRows: 3,
					maxColumns: 3
				},
				rowSizing: 'auto',
				columnSizing: 'auto'
			};
			grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
		});

		describe('Expansion constraints', () => {
			it('should not expand when expansion is disabled', () => {
				const widget = createMockWidget();

				const result = grid.tryPlaceWidget(widget, 2, 1, 2, 2);

				expect(result).toBe(false);
			});
		});

		describe('Collision handling in constrained space', () => {
			it('should resolve collisions by moving widgets in Y direction when X fails', () => {
				// First place a widget at (0,1) with width 2, height 2
				const widget1 = createMockWidget();
				grid.tryPlaceWidget(widget1, 0, 0, 2, 2);

				// Place another widget at (2,1) to block X-movement for widget1
				const widget2 = createMockWidget();
				grid.tryPlaceWidget(widget2, 2, 0, 1, 1);

				// State:
				// aab
				// aa-
				// ---

				// Now try to place a widget at (0,1) which should force widget1 down
				const widget3 = createMockWidget();
				const result = grid.tryPlaceWidget(widget3, 0, 0, 2, 1);

				// Expected state:
				// ccb
				// aa-
				// aa-

				expect(result).toBe(true);
				expect(widget1.setBounds).toHaveBeenCalledWith(0, 1, widget1.width, widget1.height);
			});

			it('should maintain correct bitmaps when a full row is manipulated (issue #9)', () => {
				const widget1 = createMockWidget();
				const widget2 = createMockWidget();
				const widget3 = createMockWidget();
				const widget4 = createMockWidget();
				const widget5 = createMockWidget();

				// Place these along the first row to fill it
				grid.tryPlaceWidget(widget1, 0, 1, 1, 1);
				grid.tryPlaceWidget(widget2, 1, 1, 1, 1);
				grid.tryPlaceWidget(widget3, 2, 1, 1, 1);

				// State:
				// abc
				// ---
				// ---

				// Now taking widget2's place should move widget2 down
				grid.tryPlaceWidget(widget4, 1, 1, 1, 1);

				// Expected state:
				// adc
				// -b-
				// ---

				// Finally, placing widget5 where widget3 is should move widget3 down
				grid.tryPlaceWidget(widget5, 2, 1, 1, 1);

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

	describe('Column-Constrained Grid (row expansion only)', () => {
		let grid: FreeFormFlexiGrid;
		let mockTarget: InternalFlexiTargetController;

		beforeEach(() => {
			mockTarget = {} as InternalFlexiTargetController;
			const targetConfig: FlexiTargetConfiguration = {
				layout: {
					type: 'free',
					minRows: 3,
					minColumns: 3,
					maxColumns: 3
				},
				rowSizing: 'auto',
				columnSizing: 'auto'
			};
			grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
		});

		describe('Row expansion behavior', () => {
			it('should expand rows when the grid is full', () => {
				const a = createMockWidget();
				const b = createMockWidget();
				const c = createMockWidget();

				grid.tryPlaceWidget(a, 0, 0, 3, 1);
				grid.tryPlaceWidget(b, 0, 1, 3, 1);
				grid.tryPlaceWidget(c, 0, 2, 3, 1);

				// State:
				// aaa
				// bbb
				// ccc

				const d = createMockWidget();

				const result = grid.tryPlaceWidget(d, 0, 2, 3, 1);

				// Expected state:
				// aaa
				// bbb
				// ddd
				// ccc

				expect(d.setBounds).toHaveBeenCalledWith(0, 2, 3, 1);
				expect(c.setBounds).toHaveBeenCalledWith(0, 3, 3, 1);
				expect(grid.rows).toBe(4);
			});
		});
	});

	describe('Mock Grid 1', () => {
		let grid: FreeFormFlexiGrid;
		let mockTarget: InternalFlexiTargetController;

		beforeEach(() => {
			mockTarget = {} as InternalFlexiTargetController;
			const targetConfig: FlexiTargetConfiguration = {
				layout: {
					type: 'free',
					minColumns: 3,
					maxColumns: 3,
					minRows: 2,
					maxRows: 4,
					colllapsibility: 'any'
				},
				rowSizing: 'auto',
				columnSizing: 'auto'
			};
			grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
		});

		it('should expand given a combination of widgets', () => {
			const a = createMockWidget();
			const b = createMockWidget();
			const c = createMockWidget();
			const d = createMockWidget();
			const e = createMockWidget();

			grid.tryPlaceWidget(a, 0, 0, 1, 1);
			grid.tryPlaceWidget(b, 1, 0, 1, 1);
			grid.tryPlaceWidget(c, 2, 0, 1, 1);
			grid.tryPlaceWidget(d, 0, 1, 3, 1);
			grid.tryPlaceWidget(e, 0, 1, 1, 1);

			expect(d.setBounds).toHaveBeenCalledWith(0, 2, 3, 1);
			expect(grid.rows).toBe(3);
		});

		it('should maintain state during an unsuccessful placement', () => {
			// a is not draggable
			const a = createMockWidget({ draggability: 'none' });
			const b = createMockWidget();
			const c = createMockWidget();
			const d = createMockWidget();
			const e = createMockWidget();

			// State:
			// abc
			// ddd
			// e--

			grid.tryPlaceWidget(a, 0, 0, 1, 1);
			grid.tryPlaceWidget(b, 1, 0, 1, 1);
			grid.tryPlaceWidget(c, 2, 0, 1, 1);
			grid.tryPlaceWidget(d, 0, 1, 3, 1);
			grid.tryPlaceWidget(e, 0, 2, 1, 1);

			// Now try to move e to (0, 0)
			const result = grid.tryPlaceWidget(e, 0, 0, 1, 1);

			// Expected state:
			// abc
			// ddd
			// e--

			expect(result).toBe(false);
			expect(grid.rows).toBe(3);
		});
	});

	describe('Column Expansion and Collapsibility Tests', () => {
		let grid: FreeFormFlexiGrid;
		let mockTarget: InternalFlexiTargetController;

		beforeEach(() => {
			mockTarget = {} as InternalFlexiTargetController;
			const targetConfig: FlexiTargetConfiguration = {
				layout: {
					type: 'free',
					minColumns: 2,
					minRows: 2,
					maxRows: 2, // Fixed at 2 rows
					colllapsibility: 'any'
				},
				rowSizing: 'auto',
				columnSizing: 'auto'
			};
			grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
		});

		describe('Column expansion', () => {
			it('should expand columns when placing widgets beyond current boundaries', () => {
				const widget1 = createMockWidget();
				const widget2 = createMockWidget();

				// State:
				// --
				// --

				grid.tryPlaceWidget(widget1, 0, 0, 1, 2);
				const result = grid.tryPlaceWidget(widget2, 1, 0, 3, 2);

				// Expected state:
				// abbb
				// abbb

				expect(result).toBe(true);

				expect(grid.columns).toBe(4);
				expect(widget1.setBounds).toHaveBeenCalledWith(0, 0, 1, 2);
				expect(widget2.setBounds).toHaveBeenCalledWith(1, 0, 3, 2);
			});

			it('should handle placing wide widgets that require column expansion', () => {
				const widget = createMockWidget();

				// State:
				// --
				// --

				const result = grid.tryPlaceWidget(widget, 1, 0, 5, 1);

				// Expected state:
				// -aaaaa
				// ------

				expect(result).toBe(true);
				expect(grid.columns).toBe(6);
				expect(widget.setBounds).toHaveBeenCalledWith(1, 0, 5, 1);
			});
		});

		// TODO: grid collapsibility tests - which needs a fix to how positions
		// are normalised.
	});

	describe('Min/max widget dimensions', () => {
		let grid: FreeFormFlexiGrid;
		let mockTarget: InternalFlexiTargetController;

		beforeEach(() => {
			mockTarget = {} as InternalFlexiTargetController;
			const targetConfig: FlexiTargetConfiguration = {
				layout: {
					type: 'free',
					minColumns: 2,
					maxColumns: 3,
					minRows: 3,
					maxRows: 3,
					colllapsibility: 'none'
				},
				rowSizing: 'auto',
				columnSizing: 'auto'
			};
			grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
		});

		it('should respect a widget max width', () => {
			const widget = createMockWidget({ maxWidth: 2 });

			// Try to place widget with width 3, should be constrained to maxWidth of 2
			grid.tryPlaceWidget(widget, 0, 0, 3, 1);

			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 2, 1);
		});

		it('should respect a widget min width', () => {
			const widget = createMockWidget({ minWidth: 2 });

			// Try to place widget with width 1, should be expanded to minWidth of 2
			const result = grid.tryPlaceWidget(widget, 0, 0, 1, 1);

			expect(result).toBe(true);
			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 2, 1);
		});

		it('should respect a widget max height', () => {
			const widget = createMockWidget({ maxHeight: 2 });

			// Try to place widget with height 3, should be constrained to maxHeight of 2
			grid.tryPlaceWidget(widget, 0, 0, 1, 3);

			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 1, 2);
		});
		
		it('should work with basic widget placement (no constraints)', () => {
			const widget = createMockWidget();

			const result = grid.tryPlaceWidget(widget, 0, 0, 1, 1);

			expect(result).toBe(true);
			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 1, 1);
		});

		it('should respect both min and max width constraints', () => {
			const widget = createMockWidget({ minWidth: 2, maxWidth: 2 });

			// Try to place with width 1 (should be 2) and then with width 3 (should be 2)
			grid.tryPlaceWidget(widget, 0, 0, 1, 1);
			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 2, 1);

			grid.tryPlaceWidget(widget, 0, 0, 3, 1);
			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 2, 1);
		});

		it('should respect both min and max height constraints', () => {
			const widget = createMockWidget({ minHeight: 2, maxHeight: 2 });

			// Try to place with height 1 (should be 2) and then with height 3 (should be 2)
			grid.tryPlaceWidget(widget, 0, 0, 1, 1);
			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 1, 2);

			grid.tryPlaceWidget(widget, 0, 0, 1, 3);
			expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 1, 2);
		});
	});

	describe('Packing', () => {
		// Helper function to create grids with different packing strategies
		const createPackingGrid = (
			packing: 'none' | 'horizontal' | 'vertical',
			options: {
				minRows?: number;
				minColumns?: number;
				maxRows?: number;
				maxColumns?: number;
			} = {}
		): FreeFormFlexiGrid => {
			const mockTarget = {} as InternalFlexiTargetController;
			const targetConfig: FlexiTargetConfiguration = {
				layout: {
					type: 'free',
					minRows: options.minRows ?? 4,
					minColumns: options.minColumns ?? 4,
					maxRows: options.maxRows,
					maxColumns: options.maxColumns,
					packing
				},
				rowSizing: 'auto',
				columnSizing: 'auto'
			};
			return new FreeFormFlexiGrid(mockTarget, targetConfig);
		};

		describe('No Packing Strategy (packing: "none")', () => {
			let grid: FreeFormFlexiGrid;

			beforeEach(() => {
				grid = createPackingGrid('none');
			});
			
			it('should not move widgets after placement', () => {
				const widget1 = createMockWidget();
				const widget2 = createMockWidget();

				// Placements:
				// a--
				// -b-
				// ---

				grid.tryPlaceWidget(widget1, 0, 0, 1, 1);
				grid.tryPlaceWidget(widget2, 1, 1, 1, 1);

				// Expected state:
				// a--
				// -b-
				// ---

				expect(widget1.setBounds).toHaveBeenCalledWith(0, 0, 1, 1);
				expect(widget2.setBounds).toHaveBeenCalledWith(1, 1, 1, 1);
			});
		});

		describe('Horizontal Packing Strategy (packing: "horizontal")', () => {
			let grid: FreeFormFlexiGrid;

			beforeEach(() => {
				grid = createPackingGrid('horizontal');
			});

			// TODO: Implement tests for horizontal packing behavior
			// - Widgets should be packed toward the left
			// - Empty columns on the left should be eliminated when possible
			// - Order preservation during packing
			// - Collision handling during packing operations
			
			it.todo('should pack widgets toward the left');
			it.todo('should eliminate empty columns on the left when possible');
			it.todo('should preserve widget order during packing');
			it.todo('should handle collisions during packing operations');
			it.todo('should respect widget constraints during packing');
		});

		describe('Vertical Packing Strategy (packing: "vertical")', () => {
			let grid: FreeFormFlexiGrid;

			beforeEach(() => {
				grid = createPackingGrid('vertical');
			});

			// TODO: Implement tests for vertical packing behavior
			// - Widgets should be packed toward the top
			// - Empty rows at the top should be eliminated when possible
			// - Order preservation during packing
			// - Collision handling during packing operations
			
			it.todo('should pack widgets toward the top');
			it.todo('should eliminate empty rows at the top when possible');
			it.todo('should preserve widget order during packing');
			it.todo('should handle collisions during packing operations');
			it.todo('should respect widget constraints during packing');
		});

		describe('Packing Strategy Comparison Tests', () => {
			// TODO: Implement comparative tests between different packing strategies
			// - Same widget placement with different packing strategies
			// - Performance comparisons
			// - Edge case handling across strategies
			
			it.todo('should produce different layouts with different packing strategies');
			it.todo('should handle edge cases consistently across packing strategies');
			it.todo('should maintain grid validity regardless of packing strategy');
		});

		describe('Packing with Grid Constraints', () => {
			// TODO: Test packing behavior with various grid constraints
			// - Fixed size grids
			// - Column-constrained grids  
			// - Row-constrained grids
			// - Minimum/maximum dimension constraints
			
			describe('Fixed Size Grid Packing', () => {
				it.todo('should pack widgets within fixed grid boundaries');
				it.todo('should handle packing when grid cannot expand');
			});

			describe('Column-Constrained Packing', () => {
				it.todo('should pack widgets with column expansion limits');
				it.todo('should prioritize vertical packing when columns are constrained');
			});

			describe('Row-Constrained Packing', () => {
				it.todo('should pack widgets with row expansion limits');
				it.todo('should prioritize horizontal packing when rows are constrained');
			});
		});
	});
});
