---
name: flexiboards
description: Build, change, or debug drag-and-drop boards with Flexiboards (@flexiboards/svelte, @flexiboards/react, @flexiboards/core). Use this whenever a task involves a dashboard grid, kanban columns, a sortable list, resizable tiles, moving items between lists, saving or restoring a board layout, or any FlexiBoard, FlexiTarget, FlexiWidget, FlexiAdd or FlexiDelete code, even if the user only says "make the cards draggable" or "let me rearrange the widgets".
---

# Flexiboards

Flexiboards is a headless drag-and-drop toolkit where the grid is the model. You declare targets (grids) and widgets; the library places widgets, moves them between targets, resizes them, drives the whole thing from the keyboard, and exports the result as data you can store. It renders no visuals of its own beyond grid placement, so every class and every element is yours.

Two adapters share one core and one API: `@flexiboards/svelte` (Svelte 5) and `@flexiboards/react` (React 18 and 19). Everything below applies to both unless a line names one.

## Decide the shape first

| You want                                                                      | Use                                                                                                                         |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| A single sortable list, nothing else                                          | `FlexiSortable` preset (`direction="vertical"` or `"horizontal"`); a flow target on a board with the layout chosen          |
| A single dashboard grid, nothing else                                         | `FlexiDashboard` preset (`columns`, `rows`, `maxRows`, `resizable`); a free target on a board                               |
| Items keep an order and pack together (kanban column, sortable list, gallery) | `layout: { type: 'flow', flowAxis: 'row' or 'column', placementStrategy: 'append' }`                                        |
| Items sit at coordinates and can leave gaps (dashboard, launcher)             | `layout: { type: 'free', minColumns, maxColumns, minRows, maxRows }`                                                        |
| Several lists that trade items                                                | One `FlexiBoard`, one `FlexiTarget` per list, each with a `keyName` (React) or `key` (Svelte)                               |
| Different layouts per screen size                                             | `ResponsiveFlexiBoard` around the board, with `breakpoints`                                                                 |
| Users add items by dragging from a palette                                    | `FlexiAdd` with an `addWidget` function                                                                                     |
| Users remove items by dropping them somewhere                                 | `FlexiDelete`                                                                                                               |
| Save and restore                                                              | `board.exportLayout()`, `board.importLayout()`, or `loadLayout` and `onLayoutChange` in the board config, plus a `registry` |

Start with a preset when the board is one list or one grid; they take the same `config`, `targetConfig`, callbacks and children as the full components, and swapping to `FlexiBoard` + `FlexiTarget` later is mechanical. Reach for the full components when there are several targets, a header or footer around the grid, or the target is not the whole board.

## The smallest working board

Svelte:

```svelte
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
	<FlexiTarget
		key="list"
		class="gap-2"
		config={{ layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' } }}
	>
		<FlexiWidget class="rounded border p-3">First</FlexiWidget>
		<FlexiWidget class="rounded border p-3">Second</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

React:

```tsx
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';

const boardConfig = { widgetDefaults: { draggability: 'full' } } as const;
const listConfig = {
	layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' }
} as const;

export function List() {
	return (
		<FlexiBoard config={boardConfig}>
			<FlexiTarget keyName="list" className="gap-2" config={listConfig}>
				<FlexiWidget className="rounded border p-3">First</FlexiWidget>
				<FlexiWidget className="rounded border p-3">Second</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

The grid element is a CSS grid; `class` / `className` on `FlexiTarget` styles it, so `gap-*` and sizing go there. `FlexiWidget` renders nothing itself; its content is rendered inside the placed cell.

## Naming differences between the adapters

| Svelte                            | React                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `class`                           | `className`                                                                                           |
| `<FlexiTarget key="x">`           | `<FlexiTarget keyName="x">`                                                                           |
| `containerClass`                  | `containerClassName`                                                                                  |
| `{#snippet children({ widget })}` | `{({ widget }) => ...}` as children                                                                   |
| `header` / `footer` snippets      | `header` / `footer` props, node or `({ target }) => ...`                                              |
| `bind:controller={c}`             | no twin; use `onfirstcreate={(c) => ...}`                                                             |
| `getFlexiwidgetCtx()`             | `useFlexiWidget()` (also `useFlexiBoard`, `useFlexiTarget`, `useFlexiAdd`, `useResponsiveFlexiBoard`) |
| `{#snippet suspense({ reason })}` | `suspense={(reason) => ...}`                                                                          |

Whatever a hook or `onfirstcreate` hands you is a reactive proxy: read `widget.isGrabbed`, `widget.x`, `target.dropRejected`, `board.currentWidgetAction` during render and the component re-renders when they change. Reads in event handlers are plain reads.

## Configuration, in one paragraph

Config is one object with three levels: `FlexiBoard config` (`widgetDefaults`, `targetDefaults`, `registry`, `loadLayout`, `onLayoutChange`, callbacks), `FlexiTarget config` (`layout`, `rowSizing`, `columnSizing`, `widgetDefaults`), and `FlexiWidget` props (`x`, `y`, `width`, `height`, `draggability`, `resizability`, `transition`, `type`, `metadata`, `component`, `componentProps`). The most specific level wins. `draggability` is `'none' | 'movable' | 'full'` and `resizability` is `'none' | 'horizontal' | 'vertical' | 'both'`; the defaults are `'full'` and `'none'`. Animations come from `transition: { move, drop, resize }`, each `cssTransition({ duration, easing })` or `spring({ duration, bounce })`; `simpleTransitionConfig()` and `springTransitionConfig()` are the presets.

## Changing the board from code

Every controller you can reach exposes actions. All of them fire `onLayoutChange`.

```ts
widget.delete(); // also fires onWidgetDelete
widget.moveTo({ x: 0, y: 1 }); // within its target; false if the grid refuses
widget.moveTo({ target: doing, x: 0, y: 0 });
target.createWidget({ type: 'card', metadata: { id } }); // undefined if it cannot be placed
target.clear();
board.clear();
board.importLayout(saved); // the load; does not fire onLayoutChange
const layout = board.exportLayout(); // { [targetKey]: [{ type?, id, x, y, width, height, metadata }] }
const stored = board.exportLayoutEnvelope(); // { version, layout }: persist this; importLayout accepts either
```

A widget needs a `type` that exists in the board's `registry` to be re-rendered on import. Untyped widgets are still exported but skipped on import. Put your own identifiers in `metadata`.

## Reacting to what the user does

Board config callbacks, all fired after the change is committed:

```ts
const config = {
	onWidgetGrab: ({ widget, target }) => {},
	onWidgetDrop: ({ widget, sourceTarget, target }) => {}, // sourceTarget undefined for a FlexiAdd drop
	onWidgetResize: ({ widget, target }) => {},
	onWidgetCancel: ({ widget, target }) => {},
	onWidgetDelete: ({ widget, target }) => {},
	onWidgetEnterTarget: ({ widget, target }) => {}, // hover styling for the candidate column
	onWidgetLeaveTarget: ({ widget, target }) => {},
	canDrop: ({ widget, target, x, y, width, height }) => true, // false shows a rejected preview and refuses the release
	onLayoutChange: (layout) => save(layout) // debounced
};
```

`canDrop` guards the user; `moveTo` ignores it on purpose. A target config can carry its own `canDrop` for rules that belong to one list.

## Rules that bite

- React: keep `config` objects and class functions referentially stable (module scope, `useMemo`, or `useState`). A fresh object each render pushes an update into the board every render.
- React: `onfirstcreate` fires after the first commit, so it may `setState`. To render from a controller held in state, pass it through `useReactive(controller)`; it accepts `undefined` until the controller arrives.
- Widgets are created once, when the target first loads. A `FlexiWidget` you add to the tree later is not created (a console warning says so); use `target.createWidget()` or `FlexiAdd` for runtime additions.
- Widgets are grabbed by their body unless a `FlexiGrab` is inside them; then only the handle grabs, and the body's text stays selectable. `FlexiResize` works the same way for resizing. Both render a `<button>`.
- A board nested inside another board's widget works (kanban block inside a page). Each board is independent; a `FlexiTarget` belongs to the nearest `FlexiBoard`.
- The keyboard drives a virtual pointer: Enter grabs, arrow keys move it, Enter drops, Escape cancels. Do not add your own key handlers on the widget for those keys.
- `exportLayout()` on a board under `ResponsiveFlexiBoard` warns; export from the responsive controller instead, which returns every breakpoint.
- Server rendering works in both adapters (`renderToString` in React); stored layouts loaded on the client can show a `suspense` fallback until they arrive.
- Vite dev: the site's packages are linked builds. After changing `packages/core` or `packages/react`, rebuild them and restart the dev server, or you will be looking at stale code.

## Testing a board

Both adapters have component tests in `packages/{react,svelte}/tests`. The pattern: mount the board, give it geometry (happy-dom has no layout, so stub `getBoundingClientRect` on the board, grid and cells, and stub the grid's computed `grid-template-columns/rows` to pixel tracks), then drive it with real events: `keydown Enter` on a cell or handle grabs, a `pointermove` on `window` moves the virtual pointer, `keydown Enter` on `window` drops, `Escape` cancels. Read results from the DOM (`[role="cell"]` with `aria-colindex` / `aria-rowindex`) or from a controller captured with `onfirstcreate`. During a grab the target renders a preview cell with `aria-label="Widget action preview"`; exclude it when counting. Copy `packages/react/tests/helpers.tsx` (`layoutGrid`, `MockResizeObserver`, `keydown`, `pointerMove`) rather than rewriting it.

## Read more

Every docs page is available as Markdown by appending `.md` to its URL, and the index is at https://flexiboards.dev/llms.txt (full text: `/llms-full.txt`). Fetch the page for the component you are working with before guessing at a prop:

- https://flexiboards.dev/docs/controllers.md for the controller actions and callbacks
- https://flexiboards.dev/docs/components/board.md, `target.md`, `widget.md` for prop and type tables
- https://flexiboards.dev/docs/guides/exporting-importing-boards.md for persistence
- https://flexiboards.dev/docs/guides/responsive-layouts.md and `server-side-rendering.md` when those apply
