import { describe, it, expect } from 'vitest';
import { findCell, contentSize } from './utils.svelte.js';

describe('contentSize', () => {
	it('computes total size from columns and gaps', () => {
		// 6 columns of 200px + 5 gaps of 8px = 1240px
		const columns = [200, 200, 200, 200, 200, 200];
		expect(contentSize(columns, 8)).toBe(1240);
	});

	it('handles single column with no gaps', () => {
		expect(contentSize([200], 8)).toBe(200);
	});

	it('handles empty array', () => {
		expect(contentSize([], 8)).toBe(0);
	});
});

describe('findCell', () => {
	// Simulates the scrolled overflow scenario:
	// 6 columns of 200px, 8px gap, grid element at left=54 in viewport,
	// but content is 1240px wide (extends well past the 598px element width).
	const columns = [200, 200, 200, 200, 200, 200];
	const gap = 8;
	const totalSize = contentSize(columns, gap); // 1240

	describe('with content-based size (fix)', () => {
		it('returns fractional cell when pointer is within scrolled content', () => {
			// Grid element left=54, content is 1240px wide.
			// Pointer at clientX=1278 is ~1224px into content — should be in column 5.
			const result = findCell(1278, 54, totalSize, gap, columns);
			expect(result).toBeGreaterThan(5);
			expect(result).toBeLessThan(6);
		});

		it('returns fractional cell for middle columns when scrolled', () => {
			// Pointer at clientX=500, grid left=54 → 446px into content → column 2
			const result = findCell(500, 54, totalSize, gap, columns);
			expect(result).toBeGreaterThan(2);
			expect(result).toBeLessThan(3);
		});

		it('clamps to 0 when pointer is before the grid', () => {
			expect(findCell(10, 54, totalSize, gap, columns)).toBe(0);
		});

		it('clamps to column count when pointer is past all content', () => {
			// Past the full 1240px of content
			expect(findCell(2000, 54, totalSize, gap, columns)).toBe(6);
		});
	});

	describe('regression: element width vs content width', () => {
		const elementWidth = 598; // getBoundingClientRect().width

		it('incorrectly clamps with element width when pointer is in scrolled area', () => {
			// This was the bug: using 598px element width instead of 1240px content width.
			// Pointer at 1278px, grid left at 54. start + elementWidth = 54 + 598 = 652.
			// 1278 >= 652, so it would clamp to 6 (the end).
			const buggyResult = findCell(1278, 54, elementWidth, gap, columns);
			expect(buggyResult).toBe(6); // Clamped — wrong!

			// With content-based size, we get a fractional value.
			const fixedResult = findCell(1278, 54, totalSize, gap, columns);
			expect(fixedResult).not.toBe(6);
			expect(fixedResult).toBeGreaterThan(5);
			expect(fixedResult).toBeLessThan(6);
		});
	});
});
