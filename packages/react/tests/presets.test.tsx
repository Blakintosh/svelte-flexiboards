import { describe, it, expect, afterEach } from 'vitest';
import { FlexiDashboard, FlexiSortable, FlexiWidget } from '../src/index.js';
import { cells, flushTimers, mount, type Mounted } from './helpers.js';

let mounted: Mounted | undefined;

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	document.body.innerHTML = '';
});

describe('presets', () => {
	it('FlexiSortable is a one-column flow list of fully draggable widgets', () => {
		mounted = mount(
			<FlexiSortable className="list">
				<FlexiWidget>a</FlexiWidget>
				<FlexiWidget>b</FlexiWidget>
			</FlexiSortable>,
			{ strict: true }
		);
		const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
		expect(grid.className).toBe('list');
		expect(grid.getAttribute('aria-colcount')).toBe('1');
		expect(cells().map((c) => c.getAttribute('aria-rowindex'))).toEqual(['0', '1']);
		expect(cells()[0].getAttribute('aria-dropeffect')).toBe('move');
	});

	it('FlexiSortable runs horizontally on request', () => {
		mounted = mount(
			<FlexiSortable direction="horizontal">
				<FlexiWidget>a</FlexiWidget>
				<FlexiWidget>b</FlexiWidget>
			</FlexiSortable>
		);
		const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
		expect(grid.getAttribute('aria-rowcount')).toBe('1');
		expect(cells().map((c) => c.getAttribute('aria-colindex'))).toEqual(['0', '1']);
	});

	it('FlexiDashboard is a fixed free grid, resizable on request', () => {
		mounted = mount(
			<FlexiDashboard columns={3} rows={2} resizable>
				<FlexiWidget x={0} y={0} width={2} height={1}>
					wide
				</FlexiWidget>
			</FlexiDashboard>,
			{ strict: true }
		);
		const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
		expect(grid.getAttribute('aria-colcount')).toBe('3');
		expect(grid.getAttribute('aria-rowcount')).toBe('2');
		expect(cells()[0].getAttribute('aria-colspan')).toBe('2');
		expect(cells()[0].getAttribute('aria-label')).toBe('Interactive widget');
	});
});
