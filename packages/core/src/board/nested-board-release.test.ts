// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { InternalFlexiBoardController } from './controller.js';
import { flexiportal, destroyFlexiportal } from '../portal.js';
import { getFlexiEventBus } from '../shared/event-bus.js';
import { getPointerService } from '../shared/utils.js';

/*
  Regression (seen on the Notes example's nested kanban board in React): the
  flight after a drop started from the wrong place. The board captures the
  released widget's on-screen box in its release handler, assuming it is the
  first subscriber on the bus. A board constructed *after* the shared portal —
  a nested board an adapter mounts later — subscribes after it, so the portal
  had already returned the element to the grid (where its in-hand absolute
  style resolves against a different containing block) before the capture.
*/

afterEach(() => {
	destroyFlexiportal();
	document.body.innerHTML = '';
});

const rect = (left: number, top: number, width = 100, height = 50) =>
	({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

describe('release capture order', () => {
	it('records the in-portal box even when the board subscribed after the portal', () => {
		// An outer board brings the portal to life first, as it would on a page.
		const outer = new InternalFlexiBoardController({ config: {} } as any, null);
		flexiportal(outer);

		// The nested board comes later, so its release handler runs after the portal's.
		const board = new InternalFlexiBoardController(
			{
				config: { widgetDefaults: { transition: { drop: { duration: 150, easing: 'ease-out' } } } }
			} as any,
			null
		);
		const target = board.createTarget(
			{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } } as any,
			'left'
		);
		const grid = target.createGrid();
		const gridEl = document.createElement('div');
		document.body.appendChild(gridEl);
		gridEl.getBoundingClientRect = () => rect(0, 0, 300, 300);
		grid.ref = gridEl;
		board.ref = document.body;

		const widget = target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;
		const el = document.createElement('div');
		gridEl.appendChild(el);
		widget.ref = el;

		// In the portal (during the grab) the element reads at the pointer; back in
		// the grid the same absolute style would read somewhere else entirely.
		el.getBoundingClientRect = () =>
			el.parentElement?.id === 'flexi-portal' ? rect(564, 452) : rect(904, 832);

		const bus = getFlexiEventBus();
		getPointerService().updatePosition(50, 50);
		bus.dispatch('widget:grabbed', {
			board,
			target,
			widget,
			clientX: 50,
			clientY: 50,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 100,
			capturedHeightPx: 50
		} as any);
		expect(el.parentElement?.id).toBe('flexi-portal');

		const flights: { left: number; top: number }[] = [];
		const originalInterpolate = widget.interpolator.interpolateMove.bind(widget.interpolator);
		widget.interpolator.interpolateMove = (dims, from, ...rest) => {
			flights.push({ left: from.left, top: from.top });
			return originalInterpolate(dims, from, ...rest);
		};

		getPointerService().updatePosition(250, 250);
		bus.dispatch('widget:release', { board, target, widget } as any);

		expect(flights.length).toBeGreaterThan(0);
		expect(flights[0]).toEqual({ left: 564, top: 452 });
	});
});
