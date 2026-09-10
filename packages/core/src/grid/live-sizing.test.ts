import { describe, it, expect } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';

describe('grid sizing follows the target config', () => {
	it('re-derives the grid style when rowSizing changes through the prop seam', () => {
		// Regression: the grid snapshotted the target config at construction, so
		// a sizing change pushed by the adapter never reached the rendered grid.
		const board = new InternalFlexiBoardController({ config: {} } as any, null);
		const target = board.createTarget(
			{ layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 2, maxRows: 2 } } as any,
			'left'
		);
		const grid = target.createGrid();
		expect(grid.style).toContain('repeat(2, minmax(1rem, auto))');

		target.updateConfig({
			layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 2, maxRows: 2 },
			rowSizing: 'minmax(0, 180px)'
		} as any);

		expect(grid.style).toContain('repeat(2, minmax(0, 180px))');
	});
});
