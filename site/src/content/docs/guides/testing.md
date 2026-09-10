---
title: Testing
description: Drive a board in a unit test with @flexiboards/testing, in a DOM that has no layout.
category: Guides
published: true
---

<script lang="ts">
	import InstallCommand from '$lib/components/docs/install-command.svelte';
	import Only from '$lib/components/docs/only.svelte';
	import Callout from '$lib/components/docs/callout.svelte';
</script>

happy-dom and jsdom report every element as zero-sized and never fire `ResizeObserver`. A board mounted there renders fine, but a pointer position resolves to no cell and a drop goes nowhere. `@flexiboards/testing` stubs exactly what core reads and dispatches the events a user would, so a component test can grab, move, and drop a widget. The adapters' own suites run on it.

<InstallCommand action="add" package="-D @flexiboards/testing" />

## Set up once

Install the `ResizeObserver` stand-in and tell the helpers how to settle the DOM after each dispatch. Put this in a Vitest setup file.

<Only svelte>

```ts
// tests/setup.ts
import { flushSync } from 'svelte';
import { configure, installResizeObserver } from '@flexiboards/testing';

installResizeObserver();
configure({
	flush: (work) => {
		const result = work();
		flushSync();
		return result;
	}
});
```

</Only>

<Only react>

```ts
// tests/setup.ts
import { act } from 'react';
import { configure, installResizeObserver } from '@flexiboards/testing';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
installResizeObserver();
configure({ flush: act });
```

</Only>

## Give the board geometry

After mounting, call `layoutGrid`. It reads the grid's `aria-colcount` and `aria-rowcount`, sizes the board and grid as a square grid of `cellPx` tracks, gives every cell a box from its aria position, and fires the resize observers so core picks the sizes up. Call it again after the widget set changes. It returns a function that restores `getComputedStyle`.

<Only svelte>

```ts
import { mount, unmount } from 'svelte';
import {
	layoutGrid,
	cells,
	grabByKeyboard,
	pointerMove,
	dropByKeyboard
} from '@flexiboards/testing';
import Board from './board.svelte';

it('moves a widget to the cell under the pointer', () => {
	const component = mount(Board, { target: document.body });
	const restore = layoutGrid(100);

	grabByKeyboard(cells()[0]);
	pointerMove(250, 150); // column 2, row 1 of a free-form grid with 100px cells
	dropByKeyboard();

	expect(cells()[0].getAttribute('aria-colindex')).toBe('2');
	restore();
	unmount(component);
});
```

</Only>

<Only react>

```tsx
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
	layoutGrid,
	cells,
	grabByKeyboard,
	pointerMove,
	dropByKeyboard
} from '@flexiboards/testing';
import { Board } from './board';

it('moves a widget to the cell under the pointer', () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	act(() => root.render(<Board />));
	const restore = layoutGrid(100);

	grabByKeyboard(cells()[0]);
	pointerMove(250, 150); // column 2, row 1 of a free-form grid with 100px cells
	dropByKeyboard();

	expect(cells()[0].getAttribute('aria-colindex')).toBe('2');
	restore();
	act(() => root.unmount());
});
```

</Only>

## Helpers

| Helper                                                                          | What it does                                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `configure({ flush })`                                                          | Wraps every dispatch. Svelte: run then `flushSync()`. React: `act`.                  |
| `installResizeObserver()`                                                       | Replaces the global with a mock that `layoutGrid` fires. Returns a restore function. |
| `layoutGrid(cellPx?, { grid, left, top })`                                      | Geometry for one grid, from its aria attributes. Returns a restore function.         |
| `setRect(el, { left, top, width, height })`                                     | A box for any element, such as the board around a nested grid.                       |
| `cells()`, `realCells()`, `cellAt(x, y)`                                        | Widget cells in the document. `realCells` drops the drop preview shown mid-grab.     |
| `portal()`                                                                      | The element a grabbed widget moves into for the duration of the grab.                |
| `grabByKeyboard(el)`, `arrow(...keys)`, `dropByKeyboard()`, `cancelGrab()`      | The keyboard gesture, in pieces.                                                     |
| `pointerDown(el, x, y)`, `pointerMove(x, y)`, `pointerUp()`, `dragTo(el, x, y)` | The pointer gesture, in pieces or in one call.                                       |
| `keydown(el, key)`                                                              | Any other key.                                                                       |
| `mockFrames()`                                                                  | Queues `requestAnimationFrame` so a drop flight can be stepped with `flush()`.       |
| `flushTimers()`                                                                 | Awaits one macrotask, so React's controller grace period runs after an unmount.      |

## What to assert

Widget cells carry their position as `aria-colindex`, `aria-rowindex`, `aria-colspan` and `aria-rowspan`, so a layout assertion is an attribute read. For the model side, take the controller from `onfirstcreate` and read `board.exportLayout()` or `widget.x`. While a widget is grabbed its position tracks the pointer, so assert `isGrabbed` during the gesture and coordinates after the drop.

<Callout variant="warning" title="Long-press triggers">
`dragTo` assumes the default immediate trigger. For a long-press trigger, call `pointerDown`, advance fake timers past the press duration, then `pointerMove` and `pointerUp`.
</Callout>
