---
title: FlexiWidget
description: A component, such as a tile, that lives inside a target. You can move a widget within its target or to another target.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/flexi-widget.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## FlexiWidget (component)

<ApiProps {api} />

<Only svelte>

Widget content is rendered either from `children`, which receives the widget's controller, or from the `component` prop (with `componentProps`), or both.

```svelte
<script lang="ts">
	import { FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiWidget
	draggability="full"
	resizability="both"
	width={2}
	height={1}
	class={(widget) => ['rounded-lg border p-4', widget.isGrabbed && 'opacity-50']}
>
	{#snippet children({ widget })}
		<span>{widget.width} × {widget.height}</span>
	{/snippet}
</FlexiWidget>
```

</Only>

<Only react>

Widget content comes from `children`, which is either plain JSX or a function receiving the widget's controller, or from the `component` prop (with `componentProps`), or both. Class props are strings, or a function returning a string, so compose conditionals with a helper such as `clsx`.

```tsx
import { FlexiWidget } from '@flexiboards/react';
import { clsx } from 'clsx';

export function Tile() {
	return (
		<FlexiWidget
			draggability="full"
			resizability="both"
			width={2}
			height={1}
			className={(widget) => clsx('rounded-lg border p-4', widget.isGrabbed && 'opacity-50')}
		>
			{({ widget }) => (
				<span>
					{widget.width} × {widget.height}
				</span>
			)}
		</FlexiWidget>
	);
}
```

</Only>

## Adding widgets later

You can mount new `FlexiWidget` declarations after the target has loaded. Each declaration uses the same placement rules as `target.createWidget()`: flow grids follow their placement strategy, and free-form grids check coordinates, dimensions, and collisions.

<Only svelte>

```svelte example
<script lang="ts">
	import { FlexiSortable, FlexiWidget } from '@flexiboards/svelte';
	let notes = $state([1]);
</script>

<div class="w-full space-y-3">
	<button
		type="button"
		class="rounded border px-3 py-2"
		onclick={() => (notes = [...notes, notes.length + 1])}>Add note</button
	>
	<FlexiSortable class="gap-2">
		{#each notes as note (note)}
			<FlexiWidget id={`note-${note}`} class="rounded border p-3">Note {note}</FlexiWidget>
		{/each}
	</FlexiSortable>
</div>
```

</Only>

<Only react>

```tsx example
'use client';
import { useState } from 'react';
import { FlexiSortable, FlexiWidget } from '@flexiboards/react';

export function AddNotes() {
	const [notes, setNotes] = useState([1]);
	return (
		<div className="w-full space-y-3">
			<button
				type="button"
				className="rounded border px-3 py-2"
				onClick={() => setNotes((current) => [...current, current.length + 1])}
			>
				Add note
			</button>
			<FlexiSortable className="gap-2">
				{notes.map((note) => (
					<FlexiWidget key={note} id={`note-${note}`} className="rounded border p-3">
						Note {note}
					</FlexiWidget>
				))}
			</FlexiSortable>
		</div>
	);
}
```

</Only>

Keep list keys stable. A declaration registers once per mount; rerendering it updates its props without adding another widget. The board owns the created widget, so removing its declaration does not delete it. Use `widget.delete()` or `target.clear()` to remove widgets.

An accepted addition fires `onfirstcreate` and reports the new layout through `onLayoutChange`. If placement fails, the widget is not created and a warning explains the failure. Freeing space later does not automatically retry a rejected declaration.

## FlexiWidgetController

<Only svelte>

You can access the controller by binding to the `controller` prop, from the `onfirstcreate` callback, or from the `children` snippet parameter. Inside a component rendered by the `component` prop, call `getFlexiwidgetCtx()`.

```svelte
<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';

	const widget = getFlexiwidgetCtx();
</script>

<span>{widget.isGrabbed ? 'Moving' : 'Idle'}</span>
```

</Only>

<Only react>

You can access the controller from the `onfirstcreate` callback or the `children` function parameter. Inside a component rendered by the `component` prop, call the `useFlexiWidget()` hook. The hook returns a reactive proxy: reading a property during render re-renders the component when that property changes.

```tsx
import { useFlexiWidget } from '@flexiboards/react';

export function Tile() {
	const widget = useFlexiWidget();
	return <span>{widget.isGrabbed ? 'Moving' : 'Idle'}</span>;
}
```

</Only>

Use the `FlexiWidgetController` to read widget state directly.

<ApiReference title="Properties" api={api.controller.properties} reactApi={api.controllerReact.properties} />

<ApiReference title="Methods" api={api.controller.methods} reactApi={api.controllerReact.methods} />

## FlexiWidgetConfiguration

`FlexiWidget` accepts configuration as props. Changes to rendering, metadata, interaction options, size limits, and transitions update the existing widget. `id`, `type`, `x`, `y`, `width`, and `height` initialize the widget; changing those props does not recreate or reposition it. Use `moveTo()` for movement, or import a layout to replace widget positions and sizes. See [Configuration reactivity](/docs/configuration#reactivity).

<ApiReference title="Properties" api={api.types.FlexiWidgetConfiguration} reactApi={api.typesReact.FlexiWidgetConfiguration} />

## FlexiWidgetTransitionConfiguration

The `transition` property of a widget's configuration (or of `widgetDefaults`). See the [Transitions](/docs/transitions) guide for presets and the animation adapters.

<ApiReference title="Properties" api={api.types.FlexiWidgetTransitionConfiguration} reactApi={api.typesReact.FlexiWidgetTransitionConfiguration} />

## Accessibility

Each placed widget renders as `role="gridcell"` with one-based `aria-colindex` and `aria-rowindex`, plus `aria-colspan` and `aria-rowspan`. The held widget temporarily uses `role="group"`; its preview is hidden and inert. The `data-flexi-widget` attribute remains present in every state. A grabbable widget is in the tab order unless it contains a [FlexiGrab](/docs/components/grab), in which case the handle is.

| Key               | Effect                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| <kbd>Enter</kbd>  | Grabs the focused widget; while grabbed, drops it.                                                            |
| Arrow keys        | Moves the grabbed widget. <kbd>Shift</kbd> for larger steps, <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> for finer ones. |
| <kbd>Escape</kbd> | Cancels a grab or resize.                                                                                     |

Grabs, resizes, releases, and rejected drops are announced through the board's live region. Styling the `isGrabbed`, `isShadow`, and `dropRejected` states is up to you; see [Widget Rendering](/docs/widget-rendering#styling-by-state). Full details in [Accessibility](/docs/accessibility).
