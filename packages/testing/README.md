# @flexiboards/testing

Helpers for testing a Flexiboards board in a DOM that has no layout. happy-dom and jsdom report every element as zero-sized and never fire `ResizeObserver`, so a mounted board cannot resolve a pointer to a cell. These helpers stub what core reads and dispatch the events a user would.

```
npm i -D @flexiboards/testing
```

```ts
import {
	layoutGrid,
	cells,
	grabByKeyboard,
	pointerMove,
	dropByKeyboard
} from '@flexiboards/testing';

// after mounting the board
layoutGrid(100);
grabByKeyboard(cells()[0]);
pointerMove(250, 150);
dropByKeyboard();
```

`cellAt(x, y)` takes zero-based model coordinates. Placed widgets expose one-based ARIA row and column indices; `layoutGrid()` translates them when calculating geometry. `cells()` includes the decorative drop preview and `realCells()` excludes it. Both helpers also find the held widget while its role changes to `group`.

Setup for each framework and the full helper list: [flexiboards.dev/docs/guides/testing](https://flexiboards.dev/docs/guides/testing)

## Licence

MIT. See [LICENSE.md](https://github.com/Blakintosh/svelte-flexiboards/blob/main/LICENSE.md).
