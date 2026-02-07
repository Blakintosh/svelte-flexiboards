export type InterpolationAnimation = 'move' | 'drop' | 'resize';

export type InterpolationSize = {
	width: number;
	height: number;
};

export type PlaceholderMinDimensionLocks = {
	lockMinWidth: boolean;
	lockMinHeight: boolean;
};

/**
 * Keep min dimensions by default so auto-sized tracks remain stable while the placeholder is hidden.
 * During resize, only unlock min dimensions on axes that actually changed.
 */
export function getPlaceholderMinDimensionLocks(
	animation: InterpolationAnimation,
	newSize: InterpolationSize,
	previousSize?: InterpolationSize
): PlaceholderMinDimensionLocks {
	if (animation !== 'resize') {
		return {
			lockMinWidth: true,
			lockMinHeight: true
		};
	}

	if (!previousSize) {
		// Fallback for legacy call sites: unlock both so shrinking resize animations still work.
		return {
			lockMinWidth: false,
			lockMinHeight: false
		};
	}

	const widthChanged = newSize.width !== previousSize.width;
	const heightChanged = newSize.height !== previousSize.height;

	// Nothing resized (e.g. clamped), keep both mins in place.
	if (!widthChanged && !heightChanged) {
		return {
			lockMinWidth: true,
			lockMinHeight: true
		};
	}

	return {
		lockMinWidth: !widthChanged,
		lockMinHeight: !heightChanged
	};
}
