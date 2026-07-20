import { describe, expect, it } from 'vitest';
import { getPlaceholderMinDimensionLocks } from './interpolation-utils.js';

describe('getPlaceholderMinDimensionLocks', () => {
	it('locks both dimensions for non-resize animations', () => {
		expect(
			getPlaceholderMinDimensionLocks('move', { width: 2, height: 2 }, { width: 1, height: 1 })
		).toEqual({
			lockMinWidth: true,
			lockMinHeight: true
		});

		expect(
			getPlaceholderMinDimensionLocks('drop', { width: 2, height: 2 }, { width: 1, height: 1 })
		).toEqual({
			lockMinWidth: true,
			lockMinHeight: true
		});
	});

	it('unlocks only width when resizing width', () => {
		expect(
			getPlaceholderMinDimensionLocks('resize', { width: 4, height: 3 }, { width: 2, height: 3 })
		).toEqual({
			lockMinWidth: false,
			lockMinHeight: true
		});
	});

	it('unlocks only height when resizing height', () => {
		expect(
			getPlaceholderMinDimensionLocks('resize', { width: 2, height: 4 }, { width: 2, height: 2 })
		).toEqual({
			lockMinWidth: true,
			lockMinHeight: false
		});
	});

	it('unlocks both dimensions when both axes resized', () => {
		expect(
			getPlaceholderMinDimensionLocks('resize', { width: 4, height: 4 }, { width: 2, height: 2 })
		).toEqual({
			lockMinWidth: false,
			lockMinHeight: false
		});
	});

	it('keeps both locks when resize size is unchanged', () => {
		expect(
			getPlaceholderMinDimensionLocks('resize', { width: 2, height: 2 }, { width: 2, height: 2 })
		).toEqual({
			lockMinWidth: true,
			lockMinHeight: true
		});
	});

	it('unlocks both dimensions for resize when previous size is unavailable', () => {
		expect(getPlaceholderMinDimensionLocks('resize', { width: 2, height: 2 })).toEqual({
			lockMinWidth: false,
			lockMinHeight: false
		});
	});
});
