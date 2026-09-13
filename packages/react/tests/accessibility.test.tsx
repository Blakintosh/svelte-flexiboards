import { it, expect, afterEach } from 'vitest';
import { FlexiBoard, FlexiTarget, FlexiWidget, FlexiGrab, FlexiResize } from '../src/index.js';
import {
	mount,
	realCells,
	layoutGrid,
	keydown,
	setRect,
	pointerMove,
	flushTimers,
	type Mounted
} from './helpers.js';
let mounted: Mounted | undefined;
afterEach(async () => {
	mounted?.unmount();
	await flushTimers();
	document.body.innerHTML = '';
});
function mountFixture() {
	mounted = mount(
		<FlexiBoard>
			<FlexiTarget
				keyName="main"
				config={{ layout: { type: 'free', minColumns: 4, maxColumns: 4, minRows: 4, maxRows: 4 } }}
			>
				<FlexiWidget x={0} y={0} width={2} height={2} resizability="both">
					<FlexiGrab>Move card</FlexiGrab>
					<FlexiResize>Resize card</FlexiResize>
					<input aria-label="Card title" defaultValue="Keep my edit" />
				</FlexiWidget>
				<FlexiWidget x={3} y={0} width={1} height={1}>
					Second card
				</FlexiWidget>
				<FlexiWidget x={0} y={3} width={1} height={1} draggability="movable" resizability="none">
					<FlexiGrab>Disabled move</FlexiGrab>
					<FlexiResize>Disabled resize</FlexiResize>
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>,
		{ strict: true }
	);
}

it('exposes sparse rows, one-based positions, spans, and unique cell ownership', () => {
	mountFixture();
	const grid = document.querySelector('[role="grid"]')!;
	const rows = [...grid.querySelectorAll('[role="row"]')];
	expect(rows.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['1', '4']);
	const owned = rows.map((row) => row.getAttribute('aria-owns')!.split(' '));
	expect(owned.map((ids) => ids.length)).toEqual([2, 1]);
	expect(new Set(owned.flat()).size).toBe(3);
	expect(owned.flat().map((id) => document.getElementById(id))).toEqual(realCells());
	expect(realCells().map((cell) => cell.getAttribute('aria-colindex'))).toEqual(['1', '4', '1']);
	const first = realCells()[0];
	expect(first.getAttribute('role')).toBe('gridcell');
	expect(first.getAttribute('aria-rowspan')).toBe('2');
	expect(first.getAttribute('aria-colspan')).toBe('2');
	expect(first.tabIndex).toBe(-1);
	expect(realCells()[1].tabIndex).toBe(0);
	expect(realCells()[2].tabIndex).toBe(-1);
	const disabled = realCells()[2].querySelectorAll('button');
	expect([...disabled].every((button) => button.disabled)).toBe(true);
});

it('keeps the grabbed control focused, hides the preview, and restores semantics on cancel', async () => {
	mountFixture();
	const restore = layoutGrid();
	try {
		const cell = realCells()[0];
		const handle = cell.querySelector('button')!;
		setRect(handle, { left: 25, top: 25, width: 50, height: 50 });
		handle.focus();
		keydown(handle, 'Enter');
		await flushTimers();
		expect(document.activeElement).toBe(handle);
		expect(cell.getAttribute('role')).toBe('group');
		expect(cell.hasAttribute('aria-colindex')).toBe(false);
		expect(document.querySelector('[aria-live]')!.textContent).toContain('column 1, row 1');
		const shadow = document.querySelector<HTMLElement>('[aria-label="Widget action preview"]')!;
		expect(shadow.getAttribute('aria-hidden')).toBe('true');
		expect(shadow.inert).toBe(true);
		keydown(window, 'Escape');
		await flushTimers();
		expect(document.activeElement).toBe(handle);
		expect(cell.getAttribute('role')).toBe('gridcell');
		expect(cell.getAttribute('aria-colindex')).toBe('1');
		expect(document.querySelector('[aria-label="Widget action preview"]')).toBeNull();
		expect(document.querySelector('[aria-live]')!.textContent).toContain('Cancelled');
	} finally {
		restore();
	}
});

it('preserves cell identity, form state and ownership when a drop changes rows', async () => {
	mountFixture();
	const restore = layoutGrid();
	try {
		const cell = realCells()[1];
		const input = document.querySelector('input')!;
		input.value = 'Unsaved edit';
		cell.focus();
		keydown(cell, 'Enter');
		pointerMove(350, 250);
		keydown(window, 'Enter');
		await flushTimers();
		expect(cell.getAttribute('aria-rowindex')).toBe('3');
		expect(document.getElementById(cell.id)).toBe(cell);
		expect(document.querySelector('input')).toBe(input);
		expect(input.value).toBe('Unsaved edit');
		expect(document.activeElement).toBe(cell);
		const row = document.querySelector('[role="row"][aria-rowindex="3"]')!;
		expect(row.getAttribute('aria-owns')).toBe(cell.id);
	} finally {
		restore();
	}
});

it('lets keyboard events reach the board while a resize handle keeps focus', async () => {
	mountFixture();
	const restore = layoutGrid();
	try {
		const cell = realCells()[0];
		const resize = cell.querySelectorAll('button')[1];
		setRect(resize, { left: 150, top: 150, width: 50, height: 50 });
		resize.focus();
		keydown(resize, 'Enter');
		for (let i = 0; i < 5; i++) keydown(resize, 'ArrowDown');
		keydown(resize, 'Enter');
		await flushTimers();
		expect(cell.getAttribute('aria-rowspan')).toBe('3');
		expect(document.activeElement).toBe(resize);
		expect(document.querySelector('[aria-live]')!.textContent).toContain('released');
		keydown(resize, 'Enter');
		keydown(resize, 'Escape');
		expect(document.querySelector('[aria-live]')!.textContent).toContain('Cancelled');
	} finally {
		restore();
	}
});
