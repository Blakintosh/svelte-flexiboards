---
title: Controllers
description: Learn how to manipulate Flexiboard components via their controllers.
category: Introduction
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

## Introduction

At the heart of the `FlexiBoard`, `FlexiTarget`, and `FlexiWidget` components are their controllers. These controllers contain the logic for the components and manage the state of the board.

By default, the controllers are hidden, as they are created inside of the components. To set up your own actions, though, Flexiboards gives you several ways to reach them.

## Method 1: `onfirstcreate` callback

Every Flexiboards component accepts an `onfirstcreate` callback, which fires once, as soon as that component's controller has been created. It receives the controller as its only argument.

This is the earliest possible point at which you can act on a controller. Put work here that should happen before the board is first painted, such as importing a saved layout.

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from '@flexiboards/svelte';

	let { layout } = $props();

	function doSomething(controller: FlexiBoardController) {
		// do something with the board!
	}
</script>

<FlexiBoard onfirstcreate={doSomething}>
	<!-- ... -->
</FlexiBoard>
```

Because the callback fires during the component's setup, it also runs on the server. That means a layout imported here will be shown on the board as soon as it mounts, without any client-side code needing to run first.

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

Because it fires after commit, the callback may also call `setState`. Hold the controller in state and pass it to `useReactive()` when the *parent* needs to render from the controller's own state. `useReactive` accepts a controller that doesn't exist yet and returns a reactive proxy once it does, exactly like the hooks described below:

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

For anything rendered *inside* the board, the hooks below are simpler.

</Only>

<Only svelte>

## Method 2: `bind:controller` prop

If you don't need the controller until after the component has mounted, binding to it is the most familiar option, and is intuitive if you've already familiarised yourself with `bind:this` from Svelte (see [Svelte's documentation](https://svelte.dev/tutorial/svelte/bind-this) for more information).

Here's an example of using it to access the controller of a `FlexiBoard`:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from '@flexiboards/svelte';

	let { layout } = $props();

	let boardController: FlexiBoardController = $state() as FlexiBoardController;

	$effect(() => {
		// Do something with the controller.
		boardController.importLayout(layout);
	});
</script>

<FlexiBoard bind:controller={boardController}>
	<!-- ... -->
</FlexiBoard>
```

This approach has one drawback: to safely run methods on `boardController`, you have to wait until the component has mounted, so you cannot access the controller on the server. Where that matters, prefer `onfirstcreate`.

By the time the `onfirstcreate` callback fires, any variable bound to `controller` already holds the controller instance. If you prefer, you can read that variable rather than the `controller` parameter passed to the callback.

## Method 3: context helper

From any component rendered *inside* a Flexiboards component, you can reach the surrounding widget's controller through the `getFlexiwidgetCtx()` helper. It uses the [Svelte Context API](https://svelte.dev/docs/svelte/context) under the hood, so it must be called from the top level of a component.

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

React has no component-level controller binding. Instead, from any component rendered *inside* a Flexiboards component, you can reach the surrounding controllers with hooks:

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

The controllers returned by these hooks are **reactive proxies**. Any signal-backed getter you read while rendering is tracked, including `widget.isGrabbed`, `widget.draggability`, `widget.x` and `target.dropRejected`, and your component re-renders when it changes. There is no extra hook, selector or subscription to write. Just read the property.

Reads outside of render (in an event handler, effect or callback) are not tracked, which is exactly what you want when you're calling an imperative method:

```tsx
import { useFlexiBoard } from '@flexiboards/react';

export function ExportButton() {
	const board = useFlexiBoard();

	return <button onClick={() => console.log(board.exportLayout())}>Export</button>;
}
```

</Only>

## Changing the board from code

Once you hold a controller you can change the board without a drag. These calls run the same placement rules as a drop, and each one fires `onLayoutChange`, so a board that persists itself stays in step.

| Call | What it does |
| --- | --- |
| `widget.delete()` | Removes the widget from its target. Fires `onWidgetDelete`. |
| `widget.moveTo({ x, y })` | Moves the widget within its target. Returns `false` and leaves it in place if the grid refuses the spot. |
| `widget.moveTo({ target })` | Moves the widget to another target, wherever that target's grid puts it. Pass `x` and `y` too to choose the cell. |
| `target.createWidget(config)` | Adds a widget. Returns `undefined` if it cannot be placed. |
| `target.clear()` | Deletes every widget in the target. |
| `board.clear()` | Deletes every widget in every target. |
| `board.importLayout(layout)` | Replaces the whole board from a saved layout. Does not fire `onLayoutChange`; it is the load, not a change. |

```ts
// Move the first "done" card back into "doing", at the top.
const card = done.widgets.values().next().value;
card?.moveTo({ target: doing, x: 0, y: 0 });
```

`moveTo` skips your `canDrop` on purpose. `canDrop` guards what the *user* may do; code that calls `moveTo` is already the authority.

## Reacting to interactions

The board's configuration takes callbacks for the moments you usually need to persist, validate or announce. They fire after the board has committed the change, so the widget's `x`, `y` and `target` are final when you read them.

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/svelte';

	const config: FlexiBoardConfiguration = {
		onWidgetDrop: ({ widget, sourceTarget, target }) => {
			if (sourceTarget !== target) {
				api.moveCard(widget.metadata?.id, target.key);
			}
		},
		onWidgetDelete: ({ widget }) => api.deleteCard(widget.metadata?.id),
		// Only the "done" column accepts cards that are marked complete.
		canDrop: ({ widget, target }) => target.key !== 'done' || widget.metadata?.complete === true
	};
</script>

<FlexiBoard {config}>...</FlexiBoard>
```

</Only>

<Only react>

```tsx
import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/react';

const config: FlexiBoardConfiguration = {
	onWidgetDrop: ({ widget, sourceTarget, target }) => {
		if (sourceTarget !== target) {
			api.moveCard(widget.metadata?.id, target.key);
		}
	},
	onWidgetDelete: ({ widget }) => api.deleteCard(widget.metadata?.id),
	// Only the "done" column accepts cards that are marked complete.
	canDrop: ({ widget, target }) => target.key !== 'done' || widget.metadata?.complete === true
};

export function Board() {
	return <FlexiBoard config={config}>...</FlexiBoard>;
}
```

Keep `config` at module scope or in `useMemo`; a fresh object each render pushes an update into the board every time.

</Only>

| Callback | Fires when |
| --- | --- |
| `onWidgetGrab` | The user picks a widget up, by pointer or keyboard. |
| `onWidgetDrop` | A moved or resized widget lands. `sourceTarget` is where it came from; it is `undefined` for a widget that arrived through a `FlexiAdd`. |
| `onWidgetCancel` | The user presses Escape, or lets go where nothing accepts the widget. The widget is back where it started. |
| `onWidgetDelete` | A widget is dropped on a `FlexiDelete`, or `widget.delete()` is called. |
| `canDrop` | While the user hovers and again on release. Return `false` to refuse; the drop preview shows the rejection and the widget returns to its origin. |
| `onLayoutChange` | Any of the above changes the layout, and any call from the table in the previous section. Debounced, with the exported layout. |

`canDrop` runs alongside the grid's own rules (bounds, collisions, size limits), which apply whether or not you provide it.

## Controller APIs

Each controller's properties and methods are listed on its component's page: [FlexiBoard](/docs/components/board#flexiboardcontroller), [FlexiTarget](/docs/components/target#flexitargetcontroller), and [FlexiWidget](/docs/components/widget#flexiwidgetcontroller).
