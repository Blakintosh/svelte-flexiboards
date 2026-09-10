import { run } from './configure.js';
import { MockResizeObserver } from './observers.js';

export type Box = { left: number; top: number; width: number; height: number };

/** A DOMRect from a box. */
export function rect({ left = 0, top = 0, width = 100, height = 100 }: Partial<Box> = {}): DOMRect {
	return {
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
		x: left,
		y: top,
		toJSON() {
			return this;
		}
	} as DOMRect;
}

/** Stubs an element's layout box; a DOM without layout reports zeros otherwise. */
export function setRect(element: Element, box: Partial<Box> = {}) {
	const r = rect(box);
	element.getBoundingClientRect = () => r;
}

export type LayoutGridOptions = {
	/** The grid to lay out. Defaults to the first `[role="grid"]` in the document. */
	grid?: HTMLElement;
	/** Where the grid sits in the viewport. */
	left?: number;
	top?: number;
};

/**
 * Gives a mounted board real geometry: the board and grid become a square
 * grid of `cellPx`-sized tracks that core can read, and each cell gets its
 * box from its aria position. Call after mount, and again after any change to
 * the widget set. Returns a function that restores `getComputedStyle`.
 */
export function layoutGrid(cellPx = 100, { grid, left = 0, top = 0 }: LayoutGridOptions = {}) {
	const target = grid ?? document.querySelector<HTMLElement>('[role="grid"]');
	if (!target) throw new Error('layoutGrid: no [role="grid"] in the document');
	const board = target.closest<HTMLElement>('[role="application"]');
	const columns = Number(target.getAttribute('aria-colcount'));
	const rows = Number(target.getAttribute('aria-rowcount'));
	const size = { left, top, width: columns * cellPx, height: rows * cellPx };
	if (board) setRect(board, size);
	setRect(target, size);
	for (const cell of cells(target)) {
		const x = Number(cell.getAttribute('aria-colindex'));
		const y = Number(cell.getAttribute('aria-rowindex'));
		const w = Number(cell.getAttribute('aria-colspan')) || 1;
		const h = Number(cell.getAttribute('aria-rowspan')) || 1;
		setRect(cell, {
			left: left + x * cellPx,
			top: top + y * cellPx,
			width: w * cellPx,
			height: h * cellPx
		});
	}

	// Core reads the grid's tracks from computed style, which never resolves to
	// pixels without layout. Answer for this grid only; leave everything else.
	const original = window.getComputedStyle;
	const tracks: Record<string, string> = {
		'grid-template-columns': Array(columns).fill(`${cellPx}px`).join(' '),
		'grid-template-rows': Array(rows).fill(`${cellPx}px`).join(' '),
		'grid-column-gap': '0px',
		'grid-row-gap': '0px'
	};
	window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
		const style = original.call(window, el, pseudo);
		if (el !== target) return style;
		return new Proxy(style, {
			get(t, k) {
				if (k === 'getPropertyValue') {
					return (name: string) => tracks[name] ?? t.getPropertyValue(name);
				}
				const v = Reflect.get(t, k);
				return typeof v === 'function' ? v.bind(t) : v;
			}
		});
	}) as typeof window.getComputedStyle;

	run(() => MockResizeObserver.fire());
	return () => {
		window.getComputedStyle = original;
	};
}

/** Every widget cell under `root`, including the drop preview shown mid-grab. */
export const cells = (root: ParentNode = document) =>
	Array.from(root.querySelectorAll<HTMLElement>('[role="cell"]'));

/**
 * Cells excluding the drop preview a target renders mid-grab. The grabbed
 * widget itself is re-parented into the portal, so a document-wide query still
 * finds it.
 */
export const realCells = (root: ParentNode = document) =>
	cells(root).filter((c) => c.getAttribute('aria-label') !== 'Widget action preview');

/** The cell at a grid position, or null. */
export const cellAt = (x: number, y: number, root: ParentNode = document) =>
	realCells(root).find(
		(c) =>
			Number(c.getAttribute('aria-colindex')) === x && Number(c.getAttribute('aria-rowindex')) === y
	) ?? null;

/** The element a grabbed widget is moved into for the duration of the grab. */
export const portal = () => document.getElementById('flexi-portal');
