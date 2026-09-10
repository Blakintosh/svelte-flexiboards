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

// Everything that drives the board lives in @flexiboards/testing; setup.ts
// routes its dispatches through act(). Re-exported so the tests read as before.
export {
	flushTimers,
	MockResizeObserver,
	layoutGrid,
	setRect,
	keydown,
	pointerMove,
	pointerUp,
	cells,
	realCells,
	portal
} from '@flexiboards/testing';
