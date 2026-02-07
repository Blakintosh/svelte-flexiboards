import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPointerService } from '../shared/utils.svelte.js';
import { InternalFlexiWidgetController } from './controller.svelte.js';

function getPixelDimension(style: string, axis: 'width' | 'height') {
	const match = style.match(new RegExp(`${axis}:\\s*([^;]+);`));
	return match ? Number.parseFloat(match[1]) : null;
}

describe('InternalFlexiWidgetController resize preview style', () => {
	beforeEach(() => {
		getPointerService().updatePosition(0, 0);
	});

	it('clamps horizontal resize preview to maxWidth in pixels', () => {
		const widget = new InternalFlexiWidgetController({
			provider: {} as any,
			config: {
				width: 1,
				height: 1,
				resizability: 'horizontal',
				maxWidth: 2
			}
		});

		widget.onResizing({
			widget,
			board: {} as any,
			target: {} as any,
			offsetX: 0,
			offsetY: 0,
			clientX: 0,
			clientY: 0,
			left: 0,
			top: 0,
			capturedHeightPx: 120,
			capturedWidthPx: 100
		});

		getPointerService().updatePosition(1000, 0);
		const widthPx = getPixelDimension(widget.style, 'width');

		expect(widthPx).toBe(200);
	});

	it('clamps horizontal resize preview to available grid columns', () => {
		const widget = new InternalFlexiWidgetController({
			provider: {} as any,
			config: {
				x: 1,
				y: 0,
				width: 1,
				height: 1,
				resizability: 'horizontal',
				maxWidth: 999
			}
		});

		(widget as any).internalTarget = {
			columns: 3,
			rows: 3
		};
		widget.setBounds(1, 0, 1, 1, false);

		widget.onResizing({
			widget,
			board: {} as any,
			target: {} as any,
			offsetX: 0,
			offsetY: 0,
			clientX: 0,
			clientY: 0,
			left: 0,
			top: 0,
			capturedHeightPx: 100,
			capturedWidthPx: 100
		});

		getPointerService().updatePosition(1000, 0);
		const widthPx = getPixelDimension(widget.style, 'width');

		// x=1 in a 3-column grid means max span is 2 columns -> 200px
		expect(widthPx).toBe(200);
	});

	it('clamps horizontal resize preview to minWidth in pixels', () => {
		const widget = new InternalFlexiWidgetController({
			provider: {} as any,
			config: {
				width: 3,
				height: 1,
				resizability: 'horizontal',
				minWidth: 2
			}
		});

		widget.onResizing({
			widget,
			board: {} as any,
			target: {} as any,
			offsetX: 0,
			offsetY: 0,
			clientX: 0,
			clientY: 0,
			left: 0,
			top: 0,
			capturedHeightPx: 120,
			capturedWidthPx: 300
		});

		getPointerService().updatePosition(-1000, 0);
		const widthPx = getPixelDimension(widget.style, 'width');

		expect(widthPx).toBe(200);
	});

	it('clamps vertical resize preview to available grid rows', () => {
		const widget = new InternalFlexiWidgetController({
			provider: {} as any,
			config: {
				x: 0,
				y: 1,
				width: 1,
				height: 1,
				resizability: 'vertical',
				maxHeight: 999
			}
		});

		(widget as any).internalTarget = {
			columns: 3,
			rows: 3
		};
		widget.setBounds(0, 1, 1, 1, false);

		widget.onResizing({
			widget,
			board: {} as any,
			target: {} as any,
			offsetX: 0,
			offsetY: 0,
			clientX: 0,
			clientY: 0,
			left: 0,
			top: 0,
			capturedHeightPx: 120,
			capturedWidthPx: 80
		});

		getPointerService().updatePosition(0, 1000);
		const heightPx = getPixelDimension(widget.style, 'height');

		// y=1 in a 3-row grid means max span is 2 rows -> 240px
		expect(heightPx).toBe(240);
	});

	it('accounts for grid gaps when clamping max preview size', () => {
		const originalWindow = (globalThis as any).window;
		(globalThis as any).window = {
			getComputedStyle: vi.fn().mockReturnValue({
				columnGap: '10px',
				rowGap: '8px'
			} as CSSStyleDeclaration)
		};

		try {
			const widget = new InternalFlexiWidgetController({
				provider: {} as any,
				config: {
					x: 1,
					y: 0,
					width: 1,
					height: 1,
					resizability: 'horizontal',
					maxWidth: 999
				}
			});

			(widget as any).internalTarget = {
				columns: 3,
				rows: 3,
				grid: { ref: {} }
			};
			widget.setBounds(1, 0, 1, 1, false);

			widget.onResizing({
				widget,
				board: {} as any,
				target: {} as any,
				offsetX: 0,
				offsetY: 0,
				clientX: 0,
				clientY: 0,
				left: 0,
				top: 0,
				capturedHeightPx: 100,
				capturedWidthPx: 100
			});

			getPointerService().updatePosition(1000, 0);
			const widthPx = getPixelDimension(widget.style, 'width');

			// Max span is 2 cols; with 10px gap that should clamp at 2*100 + 10 = 210px
			expect(widthPx).toBe(210);
		} finally {
			(globalThis as any).window = originalWindow;
		}
	});

	it('uses live grid width for clamp calculations when viewport width changes (e.g. scrollbar hidden)', () => {
		const originalWindow = (globalThis as any).window;
		(globalThis as any).window = {
			getComputedStyle: vi.fn().mockReturnValue({
				columnGap: '0px',
				rowGap: '0px'
			} as CSSStyleDeclaration)
		};

		try {
			const widget = new InternalFlexiWidgetController({
				provider: {} as any,
				config: {
					x: 1,
					y: 0,
					width: 1,
					height: 1,
					resizability: 'horizontal',
					maxWidth: 999
				}
			});

			(widget as any).internalTarget = {
				columns: 3,
				rows: 3,
				grid: { ref: { clientWidth: 285, clientHeight: 300 } }
			};
			widget.setBounds(1, 0, 1, 1, false);

			widget.onResizing({
				widget,
				board: {} as any,
				target: {} as any,
				offsetX: 0,
				offsetY: 0,
				clientX: 0,
				clientY: 0,
				left: 0,
				top: 0,
				// Stale captured width (100px/unit) should be overridden by live grid (95px/unit).
				capturedHeightPx: 100,
				capturedWidthPx: 100
			});

			getPointerService().updatePosition(1000, 0);
			const widthPx = getPixelDimension(widget.style, 'width');

			// With 3 columns over 285px, unit is 95px. Max span at x=1 is 2 cols -> 190px.
			expect(widthPx).toBe(190);
		} finally {
			(globalThis as any).window = originalWindow;
		}
	});
});
