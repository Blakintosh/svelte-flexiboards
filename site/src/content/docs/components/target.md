---
title: FlexiTarget
description: A 'target' for widgets, or a dropzone. Stores a series of widget instances in a managed grid layout.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/flexi-target.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## FlexiTarget (component)

<ApiProps {api} />

<Only svelte>

Each target is identified by its `key`, and the `header` and `footer` snippets let you render content around the target's grid, receiving the target controller as a parameter.

```svelte
<script lang="ts">
	import { FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiTarget key="main" containerClass="rounded-xl border" class="gap-2">
	{#snippet header({ target })}
		<h5>Main ({target.widgets.size})</h5>
	{/snippet}

	<FlexiWidget>A widget</FlexiWidget>
</FlexiTarget>
```

</Only>

<Only react>

Each target is identified by its `keyName` prop (React reserves `key`), and the `header` and `footer` props take a function that receives the target controller and returns nodes to render around the target's grid.

```tsx
import { FlexiTarget, FlexiWidget } from '@flexiboards/react';

export function Main() {
	return (
		<FlexiTarget
			keyName="main"
			containerClassName="rounded-xl border"
			className="gap-2"
			header={({ target }) => <h5>Main ({target.widgets.size})</h5>}
		>
			<FlexiWidget>A widget</FlexiWidget>
		</FlexiTarget>
	);
}
```

</Only>

## FlexiTargetController

`FlexiTargetController` uses a [controller](/docs/controllers) to manage its state and behaviour.

<Only svelte>

You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

</Only>

<Only react>

You can reach the controller through the `onfirstcreate` callback. From any component rendered inside the target, the `useFlexiTarget()` hook returns a reactive proxy that re-renders your component when the properties you read change.

```tsx
import { useFlexiTarget } from '@flexiboards/react';

function WidgetCount() {
	const target = useFlexiTarget();
	return <span>{target.widgets.size} widgets</span>;
}
```

</Only>

Use the `FlexiTargetController` to manage the target directly and carry out actions.

<ApiReference title="Properties" api={api.controller.properties} />

<ApiReference title="Methods" api={api.controller.methods} />

More methods will be added in a future version.

## FlexiTargetConfiguration

The configuration object for the `FlexiTarget` component (the `config` prop accepts the partial form shown below), which supports reactivity where specified.

<Only svelte>

For reactivity, give the `config` prop a reactive source (a proxy).

</Only>

<Only react>

For reactivity, hold the configuration in state and pass a new object when it changes, for example with `useState` and `useMemo`. Mutating the object in place is not picked up.

</Only>

<ApiReference title="Properties" api={api.types.FlexiTargetPartialConfiguration} />

### FlexiWidgetDefaults

The default configuration for widgets.

<ApiReference title="Properties" api={api.types.FlexiWidgetDefaults} />

### FlowTargetLayout

The `layout` object for a [flow grid](/docs/flow-grids). Set `type: 'flow'`.

<ApiReference title="Properties" api={api.types.FlowTargetLayout} />

### FreeFormTargetLayout

The `layout` object for a [free-form grid](/docs/free-form-grids). Set `type: 'free'`.

<ApiReference title="Properties" api={api.types.FreeFormTargetLayout} />

## Accessibility

The target renders its grid as `role="grid"` with `aria-colcount` and `aria-rowcount`, so assistive technology can report the board's size. Keyboard interaction happens on widgets and handles, not on the target; see [Accessibility](/docs/accessibility) for the key map.
