import { describe, expect, it, vi } from 'vitest';
import { InternalFlexiWidgetController } from './controller.svelte.js';
import type { WidgetResizingEvent } from '../types.js';

describe('InternalFlexiWidgetController interpolation animation selection', () => {
	it('keeps resize animation for drop placement when action state has already been released', () => {
		const provider = { ref: null } as any;

		const widget = new InternalFlexiWidgetController({
			provider,
			config: {
				width: 2,
				height: 1,
				resizability: 'horizontal',
				transition: {
					resize: { duration: 150, easing: 'ease-out' },
					move: { duration: 150, easing: 'ease-in-out' },
					drop: { duration: 150, easing: 'ease-out' }
				}
			}
		});

		widget.ref = {
			getBoundingClientRect: () =>
				({
					left: 0,
					top: 0,
					width: 200,
					height: 100
				}) as DOMRect,
			focus: vi.fn()
		} as HTMLElement;

		const interpolateSpy = vi.fn();
		(widget.interpolator as any).interpolateMove = interpolateSpy;

		const resizeEvent: WidgetResizingEvent = {
			widget,
			board: provider,
			target: {} as any,
			offsetX: 0,
			offsetY: 0,
			clientX: 0,
			clientY: 0,
			left: 0,
			top: 0,
			capturedHeightPx: 100,
			capturedWidthPx: 200
		};

		// Start resize, then simulate release before placement update is applied.
		widget.onResizing(resizeEvent);
		widget.onReleased({
			widget,
			board: provider
		});

		widget.isBeingDropped = true;
		widget.setBounds(0, 0, 1, 1, true);

		expect(interpolateSpy).toHaveBeenCalledTimes(1);
		expect(interpolateSpy.mock.calls[0]?.[2]).toBe('resize');
	});

	it('uses interpolation hint when no action is active (dropzone preview path)', () => {
		const provider = { ref: null } as any;

		const widget = new InternalFlexiWidgetController({
			provider,
			config: {
				width: 2,
				height: 1,
				transition: {
					resize: { duration: 150, easing: 'ease-out' },
					move: { duration: 150, easing: 'ease-in-out' },
					drop: { duration: 150, easing: 'ease-out' }
				}
			}
		});

		widget.ref = {
			getBoundingClientRect: () =>
				({
					left: 0,
					top: 0,
					width: 200,
					height: 100
				}) as DOMRect,
			focus: vi.fn()
		} as HTMLElement;

		const interpolateSpy = vi.fn();
		(widget.interpolator as any).interpolateMove = interpolateSpy;

		widget.interpolationAnimationHint = 'resize';
		widget.setBounds(0, 0, 1, 1, true);

		expect(interpolateSpy).toHaveBeenCalledTimes(1);
		expect(interpolateSpy.mock.calls[0]?.[2]).toBe('resize');
	});
});
