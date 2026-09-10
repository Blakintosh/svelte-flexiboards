---
title: FlexiAdd
description: A component that allows you to drag in new widgets into a board.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/flexi-add.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## FlexiAdd (component)

<ApiProps {api} />

`FlexiAdd` renders a button inside your board. The `addWidget` prop returns the configuration of the widget to create when the button is grabbed, or `null` to add nothing.

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiAdd, type AdderWidgetConfiguration } from '@flexiboards/svelte';
	import NumberTile from './number-tile.svelte';

	function addWidget(): AdderWidgetConfiguration {
		return {
			widget: {
				component: NumberTile,
				componentProps: { number: Math.floor(Math.random() * 10) },
				draggability: 'full'
			},
			widthPx: 100,
			heightPx: 100
		};
	}
</script>

<FlexiAdd {addWidget} class="rounded-lg border border-dashed p-4">Add a widget</FlexiAdd>
```

</Only>

<Only react>

```tsx
import { FlexiAdd, type AdderWidgetConfiguration } from '@flexiboards/react';
import { NumberTile } from './number-tile';

export function Adder() {
	function addWidget(): AdderWidgetConfiguration {
		return {
			widget: {
				component: NumberTile,
				componentProps: { number: Math.floor(Math.random() * 10) },
				draggability: 'full'
			},
			widthPx: 100,
			heightPx: 100
		};
	}

	return (
		<FlexiAdd addWidget={addWidget} className="rounded-lg border border-dashed p-4">
			Add a widget
		</FlexiAdd>
	);
}
```

The `children` prop also accepts a function receiving the adder controller, and `className` may be a function too:

```tsx
<FlexiAdd addWidget={addWidget} className={(adder) => clsx('rounded-lg border p-4')}>
	{({ adder }) => <span>Add a widget</span>}
</FlexiAdd>
```

</Only>

## FlexiAddController

`FlexiAdd` uses a [controller](/docs/controllers) to manage its state and behaviour.

<Only svelte>

You can access the controller via binding to the `controller` prop, using the `onfirstcreate` callback, or from the `children` snippet parameter.

</Only>

<Only react>

You can access the controller from the `onfirstcreate` callback or the `children` function parameter. From a component rendered inside the adder, call the `useFlexiAdd()` hook.

</Only>

<ApiReference title="Properties" api={api.controller.properties} />

## AdderWidgetConfiguration

`AdderWidgetConfiguration` describes the widget that gets created and grabbed, along with the width and height the grabbed widget starts at.

<ApiReference title="Properties" api={api.types.AdderWidgetConfiguration} />

## Accessibility

`FlexiAdd` renders a native `button`, so it is focusable with <kbd>Tab</kbd>, and <kbd>Enter</kbd> creates the widget and grabs it for a keyboard drop. The button has no text of its own: put a label, or a visually hidden `span` for icon-only content, inside it. See [Accessibility](/docs/accessibility).
