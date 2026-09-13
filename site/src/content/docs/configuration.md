---
title: Configuration
description: Learn how to configure Flexiboards components.
category: Introduction
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

Boards and targets take a `config` prop; widgets take their configuration as props. Configuration cascades from board to target to widget, and it is reactive, so a board can be locked with one state change:

<Only svelte>

```svelte example title="Lockable board"
<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiBoardConfiguration
	} from '@flexiboards/svelte';

	let editing = $state(true);

	const boardConfig: FlexiBoardConfiguration = $state({
		targetDefaults: { layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' } },
		widgetDefaults: {
			draggability: 'full',
			className: (widget) => [
				'rounded-lg bg-primary px-4 py-2 text-primary-foreground',
				widget.isShadow && 'opacity-50'
			]
		}
	});

	$effect(() => {
		boardConfig.widgetDefaults!.draggability = editing ? 'full' : 'none';
	});
</script>

<div class="flex w-72 items-center gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
	<button class="rounded-md border px-3 py-1 text-sm" onclick={() => (editing = !editing)}>
		{editing ? 'Lock' : 'Unlock'}
	</button>
	<span class="text-muted-foreground text-sm"
		>{editing ? 'Widgets are draggable' : 'Widgets are locked'}</span
	>
</div>

<FlexiBoard class="w-72 rounded-b-xl border p-6 lg:w-96" config={boardConfig}>
	<FlexiTarget class="gap-3">
		<FlexiWidget>One</FlexiWidget>
		<FlexiWidget>Two</FlexiWidget>
		<FlexiWidget>Three</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="Lockable board"
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';
import type { FlexiBoardConfiguration, FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';
import { useMemo, useState } from 'react';

export function LockableBoard() {
	const [editing, setEditing] = useState(true);

	const boardConfig: FlexiBoardConfiguration = useMemo(
		() => ({
			targetDefaults: { layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' } },
			widgetDefaults: {
				draggability: editing ? 'full' : 'none',
				className: (widget: FlexiWidgetController) =>
					clsx(
						'rounded-lg bg-primary px-4 py-2 text-primary-foreground',
						widget.isShadow && 'opacity-50'
					)
			}
		}),
		[editing]
	);

	return (
		<>
			<div className="flex w-72 items-center gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
				<button
					className="rounded-md border px-3 py-1 text-sm"
					onClick={() => setEditing((v) => !v)}
				>
					{editing ? 'Lock' : 'Unlock'}
				</button>
				<span className="text-muted-foreground text-sm">
					{editing ? 'Widgets are draggable' : 'Widgets are locked'}
				</span>
			</div>

			<FlexiBoard className="w-72 rounded-b-xl border p-6 lg:w-96" config={boardConfig}>
				<FlexiTarget className="gap-3">
					<FlexiWidget>One</FlexiWidget>
					<FlexiWidget>Two</FlexiWidget>
					<FlexiWidget>Three</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		</>
	);
}
```

</Only>

Every widget picks up `draggability` from the board's `widgetDefaults`, so flipping one value locks them all. The rest of this page explains the cascade and which properties react to changes.

## Cascading configuration

On components that support children, the `config` prop carries a defaults property. Use it to set a default configuration for those children.

The following excerpts replace the opening `FlexiBoard` element in an existing board. Keep your targets and widgets inside it:

<Only svelte>

```svelte
<FlexiBoard
	config={{
		targetDefaults: {
			layout: {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			}
		}
	}}
>
	<!-- Existing targets and widgets. -->
</FlexiBoard>
```

</Only>

<Only react>

```tsx
<FlexiBoard
	config={{
		targetDefaults: {
			layout: {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			}
		}
	}}
>
	{/* Existing targets and widgets. */}
</FlexiBoard>
```

</Only>

A target that doesn't specify a layout now uses the one in `targetDefaults`.

The configuration cascades: following the hierarchy of FlexiBoard -> FlexiTarget -> FlexiWidget, the configuration applied is the nearest one that was specified.

For example, say the board's configuration has `widgetDefaults.className = 'a'` and the target's has `widgetDefaults.className = 'b'`.

- If we specify a class on a widget, `c`, then the widget will have class `c` only.
- If we don't specify a class on the widget, then the widget will have class `b`.
- If we don't specify a class on the widget, and we didn't specify `widgetDefaults.className = 'b'` on our widget's parent target, then the widget will have class `a`.

The widget's own configuration wins, and defaults fill in the properties it doesn't specify.

<Only react>

In React, the class-related properties (`className`, and the `className` inside `widgetDefaults`) are either a string or a function returning a string. Use a helper such as `clsx` to compose conditional classes:

```tsx
import { clsx } from 'clsx';
import type { FlexiWidgetController } from '@flexiboards/react';

const widgetClassName = (widget: FlexiWidgetController) =>
	clsx('rounded-lg px-4 py-2', widget.isGrabbed && 'opacity-50');
```

</Only>

## Reactivity

Flexiboards' configuration system is reactive. If the configuration object you pass to the `config` prop changes, the board picks up the change for a number of the properties on that object.

For example, you can use this system to quickly change whether widgets are draggable on the board.

<Only svelte>

In Svelte, pass a configuration object declared with a rune, and mutate it:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/svelte';

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggability: 'full'
		}
	});
</script>

<FlexiBoard config={boardConfig}>
	<!-- Your targets and widgets would be inside here. -->
</FlexiBoard>
```

Here, we've set `widgetDefaults.draggability = 'full'` on our board's configuration, so all widgets (that haven't specified their own `draggability` prop) will be fully draggable. To lock the board, set `boardConfig.widgetDefaults.draggability = 'none'`. The board and its widgets update on their own.

</Only>

<Only react>

In React, hold the state that drives your configuration in `useState`, and derive the configuration object from it with `useMemo`. Replace the config and any nested objects whose values change. The adapter compares configuration values before updating the board. `useMemo` can keep unchanged configuration stable across renders:

```tsx
import { FlexiBoard } from '@flexiboards/react';
import type { FlexiBoardConfiguration } from '@flexiboards/react';
import { useMemo, useState } from 'react';

export function LockableBoard() {
	const [editing, setEditing] = useState(true);

	const boardConfig: FlexiBoardConfiguration = useMemo(
		() => ({
			widgetDefaults: {
				draggability: editing ? 'full' : 'none'
			}
		}),
		[editing]
	);

	return (
		<>
			<button onClick={() => setEditing((v) => !v)}>{editing ? 'Done' : 'Edit'}</button>
			<FlexiBoard config={boardConfig}>{/* Your targets and widgets. */}</FlexiBoard>
		</>
	);
}
```

Here, all widgets (that haven't specified their own `draggability` prop) are fully draggable while `editing` is true, and locked when it flips to false. Only the properties that actually changed are pushed into the board, so widgets keep any state that was set on their controllers imperatively.

Individual `FlexiWidget` props are reactive in the same way. They're read on every render, so a value derived from component state flows straight through.

</Only>

Use these boundaries when changing an existing board:

| Configuration                                                                                                        | Update behavior                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Widget content, classes, `componentProps`, `metadata`, draggability, resizability, triggers, limits, and transitions | Prop changes update the existing widget. Defaults on the board or target apply where the widget has no explicit value. |
| Widget `id`, `type`, `x`, `y`, `width`, and `height`                                                                 | Read when the widget is created. Use `moveTo()` for a move; import a layout to replace positions or sizes.             |
| Target `layout.type`                                                                                                 | Chooses the grid implementation at creation. Recreate the target to switch between free and flow grids.                |
| Target identifier                                                                                                    | Set when the target is created. Keep it stable so stored layouts still identify the target.                            |
| `initialLayout` / `initialLayouts`                                                                                   | Seed the initial render. To load another saved layout after mount, call the appropriate controller's `importLayout()`. |
| `loadLayout` / `loadLayouts`                                                                                         | Called during client initialization. Replacing the callback does not request another load.                             |

Changes to size limits constrain later placements; they do not request an immediate resize. [Controller actions](/docs/controllers#changing-the-board-from-code) run placement rules and report their outcome.

## Deprecated and removed

- `simpleTransitionConfig()` is deprecated and retains its original 150ms easing. Use `cssTransitionConfig()` for the current CSS preset. See [Transitions](/docs/transitions).

Removed in v1.0: the `draggable` boolean (use `draggability`) and `width`/`height` in `widgetDefaults`. See [Migrating to v1.0](/docs/breaking-changes-to-10).

The generated tables on each component's API page also flag deprecated members.
