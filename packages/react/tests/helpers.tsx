import { act, StrictMode, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export type Mounted = {
	host: HTMLDivElement;
	/** Re-render the same root with new content. */
	render: (node: ReactNode) => void;
	unmount: () => void;
};

/**
 * Mounts a tree into document.body inside act(). `strict` wraps it in
 * StrictMode so effects mount/unmount/mount and renders double-invoke, which
 * is what the adapter's lifecycle helpers are designed to survive.
 */
export function mount(node: ReactNode, { strict = false } = {}): Mounted {
	const host = document.createElement('div');
	document.body.appendChild(host);
	let root!: Root;
	const wrap = (n: ReactNode) => (strict ? <StrictMode>{n}</StrictMode> : n);
	act(() => {
		root = createRoot(host);
		root.render(wrap(node));
	});
	return {
		host,
		render: (n) => act(() => root.render(wrap(n))),
		unmount: () => {
			act(() => root.unmount());
			host.remove();
		}
	};
}

/**
 * Lets the adapter's grace-period timers fire: controller destroys and orphan
 * sweeps are scheduled on a macrotask so a StrictMode remount can cancel them.
 */
export async function flushTimers() {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
	});
}

/**
 * happy-dom has no layout: ResizeObserver callbacks never fire and computed
 * grid tracks never resolve to pixels. This stand-in records observers so a
 * test can fire them after stubbing geometry.
 */
export class MockResizeObserver {
	static instances = new Set<MockResizeObserver>();
	constructor(private cb: ResizeObserverCallback) {}
	observe() {
		MockResizeObserver.instances.add(this);
	}
	unobserve() {}
	disconnect() {
		MockResizeObserver.instances.delete(this);
	}
	static fire() {
		for (const o of MockResizeObserver.instances) {
			o.cb([{} as ResizeObserverEntry], o as unknown as ResizeObserver);
		}
	}
}

/**
 * Gives the mounted board real geometry: the board and grid become a
 * `cellPx`-sized square grid whose tracks core can read, and each cell gets
 * its box from its aria position. Call after mount and after any change to
 * the widget set.
 */
export function layoutGrid(
	cellPx = 100,
	{
		grid = document.querySelector<HTMLElement>('[role="grid"]')!,
		left = 0,
		top = 0
	}: { grid?: HTMLElement; left?: number; top?: number } = {}
) {
	const board = grid.closest<HTMLElement>('[role="application"]')!;
	const columns = Number(grid.getAttribute('aria-colcount'));
	const rows = Number(grid.getAttribute('aria-rowcount'));
	setRect(board, { left, top, width: columns * cellPx, height: rows * cellPx });
	setRect(grid, { left, top, width: columns * cellPx, height: rows * cellPx });
	for (const cell of cells(grid)) {
		const x = Number(cell.getAttribute('aria-colindex'));
		const y = Number(cell.getAttribute('aria-rowindex'));
		const w = Number(cell.getAttribute('aria-colspan'));
		const h = Number(cell.getAttribute('aria-rowspan'));
		setRect(cell, {
			left: left + x * cellPx,
			top: top + y * cellPx,
			width: w * cellPx,
			height: h * cellPx
		});
	}

	const original = window.getComputedStyle.bind(window);
	window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
		const style = original(el, pseudo);
		if (el !== grid) return style;
		const tracks: Record<string, string> = {
			'grid-template-columns': Array(columns).fill(`${cellPx}px`).join(' '),
			'grid-template-rows': Array(rows).fill(`${cellPx}px`).join(' '),
			'grid-column-gap': '0px',
			'grid-row-gap': '0px'
		};
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

	act(() => MockResizeObserver.fire());
}

/** Stubs an element's layout box; happy-dom reports zeros otherwise. */
export function setRect(
	element: Element,
	{ left = 0, top = 0, width = 100, height = 100 }: Partial<DOMRect> = {}
) {
	const rect = {
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
	element.getBoundingClientRect = () => rect;
}

export function keydown(target: EventTarget, key: string) {
	act(() => {
		target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
	});
}

export function pointerMove(clientX: number, clientY: number) {
	act(() => {
		window.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY, bubbles: true }));
	});
}

/** The board's window handler turns this into widget:release. */
export function pointerUp() {
	act(() => {
		window.dispatchEvent(new Event('pointerup'));
	});
}

export const cells = (root: ParentNode = document) =>
	Array.from(root.querySelectorAll<HTMLElement>('[role="cell"]'));

/**
 * Cells excluding the drop-preview shadow a target renders mid-grab. The
 * grabbed widget itself is re-parented into the portal, so a document-wide
 * query still finds it.
 */
export const realCells = (root: ParentNode = document) =>
	cells(root).filter((c) => c.getAttribute('aria-label') !== 'Widget action preview');

export const portal = () => document.getElementById('flexi-portal');
