---
title: Testing
description: Drive a board in a unit test with @flexiboards/testing, in a DOM that has no layout.
category: Guides
published: true
---

<script lang="ts">
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
	import InstallCommand from '$lib/components/docs/install-command.svelte';
	import Only from '$lib/components/docs/only.svelte';
	import Callout from '$lib/components/docs/callout.svelte';
</script>

happy-dom and jsdom report every element as zero-sized and never fire `ResizeObserver`. A board mounted there renders fine, but a pointer position resolves to no cell and a drop goes nowhere. `@flexiboards/testing` stubs exactly what core reads and dispatches the events a user would, so a component test can grab, move, and drop a widget. The adapters' own suites run on it.

<InstallCommand action="add" package="-D @flexiboards/testing vitest happy-dom" />

## Set up once

The examples use Vitest with happy-dom and explicit test imports. Add the following to a dedicated `vitest.config.ts`, or merge the `test` settings into your existing configuration. Keep any plugins and aliases your application already needs.

<Only svelte>

The Svelte fixture needs the Svelte Vite plugin. Existing Svelte Vite projects already have it; otherwise install it:

<InstallCommand action="add" package="-D @sveltejs/vite-plugin-svelte" />

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	resolve: { conditions: ['browser'] },
	test: { environment: 'happy-dom', setupFiles: ['tests/setup.ts'] }
});
```

</Only>

<Only react>

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	esbuild: { jsx: 'automatic' },
	test: { environment: 'happy-dom', setupFiles: ['tests/setup.ts'] }
});
```

These examples import `act` from `react` for React 18.3 and 19. With React 18.0–18.2, import `act` from `react-dom/test-utils` in both `tests/setup.ts` and the test file instead.

</Only>

Install the `ResizeObserver` stand-in and tell the helpers how to settle the DOM after each dispatch in `tests/setup.ts`:

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

## Create a test fixture

Save this fixture beside the test as <FrameworkText svelte="tests/board.svelte" react="tests/board.tsx" code />. It has one widget at column 0, row 0 and an empty cell to its right.

<Only svelte>

```svelte
<!-- tests/board.svelte -->
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiBoard>
	<FlexiTarget
		key="main"
		config={{ layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 2, maxRows: 2 } }}
	>
		<FlexiWidget x={0} y={0}>A</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx
// tests/board.tsx
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';

export function Board() {
	return (
		<FlexiBoard>
			<FlexiTarget
				keyName="main"
				config={{ layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 2, maxRows: 2 } }}
			>
				<FlexiWidget x={0} y={0}>
					A
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

## Give the board geometry

After mounting, call `layoutGrid`. It reads the grid's `aria-colcount` and `aria-rowcount`, sizes the board and grid as a square grid of `cellPx` tracks, gives every cell a box from its aria position, and fires the resize observers so core picks the sizes up. Call it again after the widget set changes. It returns a function that restores `getComputedStyle`.

<Only svelte>

```ts
// tests/board.test.ts
import { it, expect } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import {
	layoutGrid,
	cells,
	grabByKeyboard,
	pointerMove,
	dropByKeyboard
} from '@flexiboards/testing';
import Board from './board.svelte';

it('moves a widget to the cell under the pointer', async () => {
	const component = mount(Board, { target: document.body });
	flushSync();
	const restore = layoutGrid(100);

	grabByKeyboard(cells()[0]);
	pointerMove(150, 50); // column 1, row 0 of a grid with 100px cells
	dropByKeyboard();

	expect(cells()[0].getAttribute('aria-colindex')).toBe('2');
	restore();
	await unmount(component);
});
```

</Only>

<Only react>

```tsx
// tests/board.test.tsx
import { it, expect } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
	flushTimers,
	layoutGrid,
	cells,
	grabByKeyboard,
	pointerMove,
	dropByKeyboard
} from '@flexiboards/testing';
import { Board } from './board';

it('moves a widget to the cell under the pointer', async () => {
	const host = document.body.appendChild(document.createElement('div'));
	const root = createRoot(host);
	act(() => root.render(<Board />));
	const restore = layoutGrid(100);

	grabByKeyboard(cells()[0]);
	pointerMove(150, 50); // column 1, row 0 of a grid with 100px cells
	dropByKeyboard();

	expect(cells()[0].getAttribute('aria-colindex')).toBe('2');
	restore();
	act(() => root.unmount());
	await flushTimers();
	host.remove();
});
```

</Only>

Run the test with `npx vitest run tests/board.test`. A successful move changes `aria-colindex` to `2`, which means model column `x: 1`. ARIA row and column indices start at 1; controller coordinates, `cellAt(x, y)`, and stored layouts start at 0. In a larger suite, move cleanup into `afterEach` so it also runs after failed assertions.

## Helpers

| Helper                                                                          | What it does                                                                                                                                        |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `configure({ flush })`                                                          | Wraps every dispatch. <FrameworkText svelte="Run dispatch, then flushSync()." react="Wrap dispatch in act()." />                                    |
| `installResizeObserver()`                                                       | Replaces the global with a mock that `layoutGrid` fires. Returns a restore function.                                                                |
| `layoutGrid(cellPx?, { grid, left, top })`                                      | Geometry for one grid, from its aria attributes. Returns a restore function.                                                                        |
| `setRect(el, { left, top, width, height })`                                     | A box for any element, such as the board around a nested grid.                                                                                      |
| `cells()`, `realCells()`, `cellAt(x, y)`                                        | Widget cells in the document. `realCells` drops the drop preview shown mid-grab.                                                                    |
| `portal()`                                                                      | The element a grabbed widget moves into for the duration of the grab.                                                                               |
| `grabByKeyboard(el)`, `arrow(...keys)`, `dropByKeyboard()`, `cancelGrab()`      | The keyboard gesture, in pieces.                                                                                                                    |
| `pointerDown(el, x, y)`, `pointerMove(x, y)`, `pointerUp()`, `dragTo(el, x, y)` | The pointer gesture, in pieces or in one call.                                                                                                      |
| `keydown(el, key)`                                                              | Any other key.                                                                                                                                      |
| `mockFrames()`                                                                  | Queues `requestAnimationFrame` so a drop flight can be stepped with `flush()`.                                                                      |
| `flushTimers()`                                                                 | <FrameworkText svelte="Awaits one macrotask for pending timer work." react="Awaits one macrotask for deferred controller cleanup after unmount." /> |

## What to assert

Placed widget cells carry their position as `aria-colindex`, `aria-rowindex`, `aria-colspan` and `aria-rowspan`, so a layout assertion is an attribute read. For the model side, take the controller from `onfirstcreate` and read `board.exportLayout()` or `widget.x`. While a widget is grabbed, its role changes to `group` and its grid indices are omitted. Assert `isGrabbed` during the gesture and coordinates after the drop. `cells()` and `realCells()` use `data-flexi-widget`, so they still find the held widget.

<Callout variant="warning" title="Long-press triggers">
`dragTo` assumes the default immediate trigger. For a long-press trigger, call `pointerDown`, advance fake timers past the press duration, then `pointerMove` and `pointerUp`.
</Callout>
