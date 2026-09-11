/*
  @flexiboards/testing: drive a Flexiboards board in a DOM that has no layout.

  happy-dom and jsdom report every box as zero and never fire ResizeObserver,
  so a board mounted there cannot resolve a pointer to a cell. These helpers
  stub what core reads, namely grid tracks, cell boxes and resize callbacks,
  and dispatch the events a user would.
*/
export { configure, flushTimers, type Flush } from './configure.js';
export { MockResizeObserver, installResizeObserver } from './observers.js';
export {
	rect,
	setRect,
	layoutGrid,
	cells,
	realCells,
	cellAt,
	portal,
	type Box,
	type LayoutGridOptions
} from './geometry.js';
export {
	keydown,
	pointerDown,
	pointerMove,
	pointerUp,
	grabByKeyboard,
	dropByKeyboard,
	cancelGrab,
	arrow,
	dragTo,
	type PointerOptions
} from './events.js';
export { mockFrames } from './frames.js';
