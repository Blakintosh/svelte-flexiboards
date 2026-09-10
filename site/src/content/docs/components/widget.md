---
title: FlexiWidget
description: A widget is a component (such as a tile) that is stored within a target (dropzone). Widgets can be moved around within a target or between targets.
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

## FlexiWidgetController

`FlexiWidgetController` uses a [controller](/docs/controllers) to manage its state and behaviour.

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

<ApiReference title="Properties" api={api.controller.properties} />

{#if api.controller.methods.length}

<ApiReference title="Methods" api={api.controller.methods} />

{:else}

`FlexiWidgetController` does not expose any methods.

{/if}

## FlexiWidgetConfiguration

The configuration object for the `FlexiWidget` component. This is not reactive when invoked as props on the component, so to mutate it reactively you will need to mutate properties on the controller.

<ApiReference title="Properties" api={api.types.FlexiWidgetConfiguration} />

## FlexiWidgetTransitionConfiguration

The `transition` property of a widget's configuration (or of `widgetDefaults`). See the [Transitions](/docs/transitions) guide for presets and the animation adapters.

<ApiReference title="Properties" api={api.types.FlexiWidgetTransitionConfiguration} />

## Accessibility

Each widget renders as `role="cell"` with `aria-colindex`, `aria-rowindex`, `aria-colspan`, `aria-rowspan`, and `aria-grabbed` while held. A grabbable widget is in the tab order unless it contains a [FlexiGrab](/docs/components/grab), in which case the handle is.

| Key | Effect |
| --- | --- |
| <kbd>Enter</kbd> | Grabs the focused widget; while grabbed, drops it. |
| Arrow keys | Moves the grabbed widget. <kbd>Shift</kbd> for larger steps, <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> for finer ones. |
| <kbd>Escape</kbd> | Cancels a grab or resize. |

Grabs, resizes, releases, and rejected drops are announced through the board's live region. Styling the `isGrabbed`, `isShadow`, and `dropRejected` states is up to you; see [Widget Rendering](/docs/widget-rendering#styling-by-state). Full details in [Accessibility](/docs/accessibility).
