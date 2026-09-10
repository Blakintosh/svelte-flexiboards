---
title: FlexiDelete
description: A component that allows you to delete widgets from a board when they are dropped over it.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/flexi-delete.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## FlexiDelete (component)

<ApiProps {api} />

`FlexiDelete` renders a dropzone inside your board; any widget dropped on it is deleted. Its controller's `isHovered` property lets you highlight it while a widget is held over it.

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiDelete } from '@flexiboards/svelte';
</script>

<FlexiDelete
	class={(deleter) => [
		'rounded-lg border border-dashed p-4',
		deleter.isHovered && 'border-red-500 text-red-500'
	]}
>
	Drag a widget here to delete it
</FlexiDelete>
```

</Only>

<Only react>

```tsx
import { FlexiDelete } from '@flexiboards/react';
import { clsx } from 'clsx';

export function Deleter() {
	return (
		<FlexiDelete
			className={(deleter) =>
				clsx(
					'rounded-lg border border-dashed p-4',
					deleter.isHovered && 'border-red-500 text-red-500'
				)
			}
		>
			Drag a widget here to delete it
		</FlexiDelete>
	);
}
```

The `children` prop also accepts a function receiving the deleter controller, if you want its state inside the content:

```tsx
<FlexiDelete>
	{({ deleter }) => <span>{deleter.isHovered ? 'Release to delete' : 'Delete'}</span>}
</FlexiDelete>
```

</Only>

## FlexiDeleteController

`FlexiDelete` uses a [controller](/docs/controllers) to manage its state and behaviour.

<Only svelte>

You can access the controller via binding to the `controller` prop, using the `onfirstcreate` callback, or from the `children` snippet parameter.

</Only>

<Only react>

You can access the controller using the `onfirstcreate` callback, or from the `children` function parameter.

</Only>

Use the `FlexiDeleteController` to read the deleter's state.

<ApiReference title="Properties" api={api.controller.properties} />

## Accessibility

`FlexiDelete` renders a `role="region"` described by the board's instructions element. Nothing inside it needs to be focusable, but it should contain a text label, or a visually hidden `span` when the content is an icon, so screen readers can name the dropzone. See [Accessibility](/docs/accessibility).
