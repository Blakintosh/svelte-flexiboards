import { describe, it, expect, afterEach } from 'vitest';
import {
	configure,
	installResizeObserver,
	MockResizeObserver,
	layoutGrid,
	cellAt,
	realCells,
	mockFrames,
	pointerDown,
	dragTo
} from './index.js';

afterEach(() => {
	document.body.innerHTML = '';
	configure({ flush: (work) => work() });
});

const board = (cellsHtml: string, columns = 3, rows = 2) => {
	document.body.innerHTML = `
		<div role="application">
			<div role="grid" aria-colcount="${columns}" aria-rowcount="${rows}">${cellsHtml}</div>
		</div>`;
	return document.querySelector<HTMLElement>('[role="grid"]')!;
};
const cell = (x: number, y: number, w = 1, h = 1, label = '') =>
	`<div role="cell" aria-colindex="${x}" aria-rowindex="${y}" aria-colspan="${w}" aria-rowspan="${h}" aria-label="${label}"></div>`;

describe('layoutGrid', () => {
	it('sizes the grid from its aria counts and each cell from its position', () => {
		const grid = board(cell(0, 0) + cell(1, 0, 2, 1) + cell(0, 1, 1, 1, 'Widget action preview'));
		const restore = installResizeObserver();
		let fired = 0;
		new ResizeObserver(() => fired++).observe(grid);

		const restoreStyle = layoutGrid(50);
		expect(grid.getBoundingClientRect().width).toBe(150);
		expect(cellAt(1, 0)!.getBoundingClientRect()).toMatchObject({ left: 50, width: 100 });
		expect(window.getComputedStyle(grid).getPropertyValue('grid-template-columns')).toBe(
			'50px 50px 50px'
		);
		expect(realCells()).toHaveLength(2);
		expect(fired).toBe(1);

		restoreStyle();
		restore();
		expect(MockResizeObserver.instances.size).toBe(0);
	});
});

describe('events', () => {
	it('runs every dispatch through the configured flush', () => {
		const grid = board(cell(0, 0));
		let wrapped = 0;
		configure({
			flush: (work) => {
				wrapped++;
				return work();
			}
		});
		const seen: string[] = [];
		grid.addEventListener('pointerdown', (e) =>
			seen.push(`${e.type}:${(e as PointerEvent).button}`)
		);
		window.addEventListener('pointermove', (e) => seen.push(e.type));
		window.addEventListener('pointerup', (e) => seen.push(e.type));
		dragTo(grid, 120, 30);
		expect(seen).toEqual(['pointerdown:0', 'pointermove', 'pointerup']);
		expect(wrapped).toBe(3);
	});

	it('marks a press as primary so core accepts it as a grab', () => {
		const grid = board(cell(0, 0));
		let event: PointerEvent | undefined;
		grid.addEventListener('pointerdown', (e) => (event = e as PointerEvent));
		pointerDown(grid, 10, 10, { pointerType: 'touch' });
		expect(event?.isPrimary).toBe(true);
		expect(event?.pointerType).toBe('touch');
	});
});

describe('mockFrames', () => {
	it('queues callbacks until flushed', () => {
		const frames = mockFrames();
		const stamps: number[] = [];
		requestAnimationFrame((t) => stamps.push(t));
		requestAnimationFrame((t) => stamps.push(t));
		expect(frames.pending).toBe(2);
		frames.flush(16);
		expect(stamps).toEqual([16, 16]);
		expect(frames.pending).toBe(0);
		frames.restore();
	});
});
