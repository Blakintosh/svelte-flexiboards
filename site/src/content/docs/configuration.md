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

For example, if you want to specify a default layout for all of your targets, you can do so like this:

<Only svelte>

```svelte
<FlexiBoard config={{
    targetDefaults: {
        layout: {
            type: 'flow',
            flowAxis: 'row',
            placementStrategy: 'append'
        }
    }
}}>
```

</Only>

<Only react>

```tsx
<FlexiBoard config={{
    targetDefaults: {
        layout: {
            type: 'flow',
            flowAxis: 'row',
            placementStrategy: 'append'
        }
    }
}}>
```

</Only>

Now, if you don't specify a layout for a target, it will use the default layout specified in the `targetDefaults` property.

This system works in a **cascading** manner, where (following the hierarchy of FlexiBoard -> FlexiTarget -> FlexiWidget) the configuration applied is the nearest specified configuration.

For example, say the board's configuration has `widgetDefaults.className = 'a'` and the target's has `widgetDefaults.className = 'b'`.

- If we specify a class on a widget, `c`, then the widget will have class `c` only.
- If we don't specify a class on the widget, then the widget will have class `b`.
- If we don't specify a class on the widget, and we didn't specify `widgetDefaults.className = 'b'` on our widget's parent target, then the widget will have class `a`.

This system prioritises the widget's configuration first, but chooses defaults where properties are not specified.

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

In React, hold the state that drives your configuration in `useState`, and derive the configuration object from it with `useMemo`. The component's prop seam compares the `config` object by identity, so it must be a _new_ object whenever something in it changes. It should equally stay stable while nothing has changed, so that unrelated re-renders don't push work into the board:

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

Not all properties are reactive like this. Generally, these are the properties that would be unnatural to change on the fly.

We document each component's configuration on their respective API pages. This includes which configuration properties are reactive and which are not.

## Deprecated properties

- `simpleTransitionConfig()` is an alias of `cssTransitionConfig()`. See [Transitions](/docs/transitions).

Removed in v1.0: the `draggable` boolean (use `draggability`) and `width`/`height` in `widgetDefaults`. See [Migrating to v1.0](/docs/breaking-changes-to-10).

Deprecated members are also flagged in the generated tables on each component's API page.
