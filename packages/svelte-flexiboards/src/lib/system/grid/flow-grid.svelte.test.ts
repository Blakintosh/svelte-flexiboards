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

	type Placement = {
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		grid?: FlowFlexiGrid;
	};

	const mockWidgetPlacement = (placement: Placement) => {
		placement.height ??= 1;
		placement.width ??= 1;
		placement.grid ??= grid;

		const widget = createMockWidget(placement.x, placement.y, placement.width, placement.height);
		const result = placement.grid.tryPlaceWidget(
			widget,
			placement.x,
			placement.y,
			placement.width,
			placement.height
		);

		expect(result).toBe(true);

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

	describe('Grid expansion', () => {});

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
	});

	describe('Snapshot and restoration', () => {});

	describe('Edge cases', () => {});
});
