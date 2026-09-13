---
title: Controllers
description: Learn how to manipulate Flexiboard components via their controllers.
category: Introduction
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

A controller exposes a board, target, or widget's state and actions. Choose access based on where your code runs:

| Task                                                      | Access                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Keep a controller for a parent component's event handlers | `onfirstcreate`                                                                                               |
| Render from a surrounding widget's state                  | The framework-specific context helper or hook below                                                           |
| Set the first layout, including SSR                       | `initialLayout` in [server-rendering configuration](/docs/guides/server-side-rendering#server-stored-layouts) |
| Replace a layout after initialization                     | `importLayout()` on a stored controller                                                                       |

The examples in the access sections are excerpts. Insert your existing targets and widgets where indicated; they focus on how to obtain the controller.

## Method 1: `onfirstcreate` callback

Components with controllers accept `onfirstcreate`. The callback receives the controller once. Use it to keep a reference for later actions. Timing depends on the adapter, as described below.

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from '@flexiboards/svelte';

	let board = $state<FlexiBoardController>();

	function rememberBoard(controller: FlexiBoardController) {
		board = controller;
	}
</script>

<FlexiBoard onfirstcreate={rememberBoard}>
	<!-- ... -->
</FlexiBoard>
```

The callback runs during component setup, including SSR. Keep browser-only work in client event handlers or effects. Use `initialLayout` for data that must appear in the server-rendered board.

</Only>

<Only react>

```tsx
import { FlexiBoard } from '@flexiboards/react';
import type { FlexiBoardController } from '@flexiboards/react';
import { useRef } from 'react';

export function MyBoard() {
	const boardRef = useRef<FlexiBoardController | null>(null);

	return (
		<FlexiBoard
			onfirstcreate={(controller) => {
				boardRef.current = controller;
				// do something with the board!
			}}
		>
			{/* ... */}
		</FlexiBoard>
	);
}
```

Stashing the controller in a ref, as above, is how you hold an imperative handle on a board in React. The callback fires once, from a layout effect after the component's first commit, so before anything is painted. The rest of your component then reaches the board through the ref.

Because it fires after commit, the callback may also call `setState`. Hold the controller in state and pass it to `useReactive()` when the _parent_ needs to render from the controller's own state. `useReactive` accepts a controller that doesn't exist yet and returns a reactive proxy once it does, exactly like the hooks described below:

```tsx
import { FlexiBoard, useReactive } from '@flexiboards/react';
import type { FlexiBoardController } from '@flexiboards/react';
import { useState } from 'react';

export function MyBoard() {
	const [controller, setController] = useState<FlexiBoardController>();
	const board = useReactive(controller);

	return (
		<>
			<p>{board?.currentWidgetAction ? 'Moving a widget…' : 'Idle'}</p>
			<FlexiBoard onfirstcreate={setController}>{/* ... */}</FlexiBoard>
		</>
	);
}
```

For anything rendered _inside_ the board, the hooks below are simpler.

</Only>

<Only svelte>

## Method 2: `bind:controller` prop

Bind `controller` to a state variable when the parent needs the instance. Guard reads before initialization.

Here's an example of using it to access the controller of a `FlexiBoard`:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from '@flexiboards/svelte';

	let boardController = $state<FlexiBoardController>();

	function clearBoard() {
		boardController?.clear();
	}
</script>

<button onclick={clearBoard}>Clear board</button>
<FlexiBoard bind:controller={boardController}>
	<!-- Existing targets and widgets. -->
</FlexiBoard>
```

The button handler runs on the client after initialization. For setup-time controller access, use `onfirstcreate`; for server-provided layout data, use `initialLayout`.

By the time the `onfirstcreate` callback fires, any variable bound to `controller` already holds the controller instance. If you prefer, you can read that variable rather than the `controller` parameter passed to the callback.

## Method 3: context helper

From any component rendered _inside_ a Flexiboards component, you can reach the surrounding widget's controller through the `getFlexiwidgetCtx()` helper. It uses the [Svelte Context API](https://svelte.dev/docs/svelte/context) under the hood, so it must be called from the top level of a component.

```svelte
<!-- my-widget-content.svelte -->
<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';

	const widget = getFlexiwidgetCtx();
</script>

<div class:opacity-50={widget.isGrabbed}>...</div>
```

</Only>

<Only react>

## Method 2: context hooks

Call these hooks from a component rendered inside the corresponding Flexiboards component:

- `useFlexiBoard()` returns the enclosing `FlexiBoard` controller
- `useFlexiTarget()` returns the enclosing `FlexiTarget` controller
- `useFlexiWidget()` returns the enclosing `FlexiWidget` controller
- `useFlexiAdd()` returns the enclosing `FlexiAdd` controller
- `useResponsiveFlexiBoard()` returns the enclosing `ResponsiveFlexiBoard` controller

Each hook throws if you call it outside of the relevant component, so you get either a controller or a clear error.

```tsx
// my-widget-content.tsx
import { useFlexiWidget } from '@flexiboards/react';

export function MyWidgetContent() {
	const widget = useFlexiWidget();

	return <div className={widget.isGrabbed ? 'opacity-50' : undefined}>...</div>;
}
```

The controllers returned by these hooks are **reactive proxies**. Any signal-backed getter you read while rendering is tracked, including `widget.isGrabbed`, `widget.draggability`, `widget.x` and `target.dropRejected`, and your component re-renders when it changes. Read the property during render to subscribe to it.

Controller collections are tracked too: reading `target.widgets.size`, iterating `target.widgets`, or reading a reactive map subscribes to changes in that collection. Tracking is otherwise shallow; replace metadata objects through the controller setter when updating them.

Reads in event handlers, effects, and callbacks do not subscribe the component to updates. For example, this button reads the layout only when pressed:

```tsx
import { useFlexiBoard } from '@flexiboards/react';

export function ExportButton() {
	const board = useFlexiBoard();

	return <button onClick={() => console.log(board.exportLayout())}>Export</button>;
}
```

</Only>

## Changing the board from code

Once you hold a controller you can change the board without a drag. Placement actions run the grid rules. Successful layout mutations notify `onLayoutChange`; import and export have separate behavior shown below.

| Call                           | What it does                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `widget.delete()`              | Removes the widget from its target. Fires `onWidgetDelete`.                                                                         |
| `widget.moveTo({ x, y })`      | Moves the widget within its target. Returns `false` and leaves it in place if the grid refuses the spot.                            |
| `widget.moveTo({ target })`    | Moves the widget to another target, wherever that target's grid puts it. Pass `x` and `y` too to choose the cell.                   |
| `target.createWidget(config)`  | Adds a widget. Returns `undefined` if it cannot be placed.                                                                          |
| `target.clear()`               | Deletes every widget in the target.                                                                                                 |
| `board.clear()`                | Deletes every widget in every target.                                                                                               |
| `board.importLayout(layout)`   | Replaces widgets in targets named by the saved layout, bare or in a `{ version, layout }` envelope. Does not fire `onLayoutChange`. |
| `board.exportLayoutEnvelope()` | The layout with its format version, the shape to persist. See [Exporting & Importing](/docs/guides/exporting-importing-boards).     |

This excerpt assumes `done` and `doing` are target controllers from the same board:

```ts
// Move the first "done" card back into "doing", at the top.
const card = done.widgets.values().next().value;
card?.moveTo({ target: doing, x: 0, y: 0 });
```

`moveTo` bypasses `canDrop`. Validate application permissions before calling it; grid placement rules still apply. A refused move returns `false`. A successful placement notifies even if the coordinates are unchanged. Clears notify only if widgets are removed.

## Reacting to interactions

Use `canDrop` for validation, grab and enter/leave callbacks for interaction progress, and drop/resize callbacks for committed changes. `onLayoutChange` reports the committed layout in a batched microtask before animations settle.

These configuration excerpts log accepted moves between targets and deletions. Keep your existing target declarations inside the board:

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/svelte';

	const config: FlexiBoardConfiguration = {
		onWidgetDrop: ({ widget, sourceTarget, target }) => {
			if (sourceTarget !== target) {
				console.info('Moved', widget.userProvidedId ?? widget.id, 'to', target.key);
			}
		},
		onWidgetDelete: ({ widget }) => console.info('Deleted', widget.userProvidedId ?? widget.id),
		// Only the "done" column accepts cards that are marked complete.
		canDrop: ({ widget, target }) => target.key !== 'done' || widget.metadata?.complete === true
	};
</script>

<FlexiBoard {config}><!-- Existing targets and widgets. --></FlexiBoard>
```

</Only>

<Only react>

```tsx
import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/react';

const config: FlexiBoardConfiguration = {
	onWidgetDrop: ({ widget, sourceTarget, target }) => {
		if (sourceTarget !== target) {
			console.info('Moved', widget.userProvidedId ?? widget.id, 'to', target.key);
		}
	},
	onWidgetDelete: ({ widget }) => console.info('Deleted', widget.userProvidedId ?? widget.id),
	// Only the "done" column accepts cards that are marked complete.
	canDrop: ({ widget, target }) => target.key !== 'done' || widget.metadata?.complete === true
};

export function Board() {
	return <FlexiBoard config={config}>{/* Existing targets and widgets. */}</FlexiBoard>;
}
```

Stable configs avoid unnecessary comparisons. Inline objects work too: the adapter compares their values before updating the board. Replace nested configuration objects when changing them rather than mutating them in place.

</Only>

| Callback                                     | Fires when                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onWidgetGrab`                               | The user picks a widget up, by pointer or keyboard.                                                                                                                                  |
| `onWidgetDrop`                               | A move commits, before its animation settles. `sourceTarget` is where it came from; it is `undefined` for a widget that arrived through a `FlexiAdd`.                                |
| `onWidgetCancel`                             | The user presses Escape, or lets go where nothing accepts the widget. The widget is back where it started.                                                                           |
| `onWidgetDelete`                             | A widget is dropped on a `FlexiDelete`, or `widget.delete()` is called.                                                                                                              |
| `onWidgetResize`                             | A resize the user was making commits.                                                                                                                                                |
| `onWidgetEnterTarget`, `onWidgetLeaveTarget` | A widget being moved is carried over a target, or leaves it. Useful for styling a column while it is the candidate.                                                                  |
| `canDrop`                                    | While the user hovers and again on release. Return `false` to refuse; the drop preview shows the rejection and the widget returns to its origin.                                     |
| `onLayoutChange`                             | Accepted drops/resizes and programmatic creation, movement, or deletion. Batched in a microtask with committed coordinates. Hover, validation, import, and export do not trigger it. |

`canDrop` runs alongside the grid's own rules (bounds, collisions, size limits), which apply whether or not you provide it. A target's own configuration can carry a `canDrop` too, for rules that belong to one list rather than the board; both must agree.

## Controller APIs

Each controller's properties and methods are listed on its component's page: [FlexiBoard](/docs/components/board#flexiboardcontroller), [FlexiTarget](/docs/components/target#flexitargetcontroller), and [FlexiWidget](/docs/components/widget#flexiwidgetcontroller).
