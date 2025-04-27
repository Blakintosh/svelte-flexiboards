---
title: Free-Form Grids
description: Learn how to use free-form grids for dashboard layouts.
category: Guides
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import FreeFormExample from '$lib/components/docs/free-form-grids/free-form-example.svelte';
</script>

_**NOTE:** In v0.1, there was ambiguity between the `base` (stored on the target's configuration) and `min` properties (stored within this layout object). A breaking change has been made to the library meaning that `baseRows` and `baseColumns` are now deprecated._

_These will be removed in v0.3. Use `layout.minRows` and `layout.minColumns` instead to set the initial size of the grid._

_Additionally, the `expandColumns` and `expandRows` properties on `layout` are now deprecated. These will be removed in v0.3. Use `maxColumns` and `maxRows` instead to control the expandability of the grid._

## Introduction

Free-form grids are a _sparse_ grid layout, where widgets can be placed anywhere within the grid. They do not enforce a particular structure, making them ideal for things such as dashboards.

The `layout` property of a `FlexiTarget`'s configuration (see [FlexiTarget](/docs/components/target)) allows you to define a FlexiTarget that uses a free-form layout. It is an object with the following properties:

```ts
export type FreeFormTargetLayout = {
	type: 'free';
	minRows?: number;
	minColumns?: number;
	maxRows?: number;
	maxColumns?: number;
};
```

- `type`: The type of layout to use, where `free` defines a free-form grid.
- `minColumns`: The minimum number of columns that the grid should have.
- `minRows`: The minimum number of rows that the grid should have.
- `maxColumns`: The maximum number of columns that the grid should have. When equal to `minColumns`, the grid will not expand in the column direction.
- `maxRows`: The maximum number of rows that the grid should have. When equal to `minRows`, the grid will not expand in the row direction.

## Example

The following code creates us a basic free-form grid with a non-expandable 2x2 layout:

```svelte example title="Free Grid"
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

<FlexiBoard class="size-72 rounded-xl border p-8 lg:size-96">
	<FlexiTarget
		class={'h-full w-full gap-4 lg:gap-6'}
		containerClass={'w-full h-full'}
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: {
				type: 'free',
				minRows: 2,
				minColumns: 2,
				maxRows: 2,
				maxColumns: 2
			}
		}}
	>
		<FlexiWidget x={0} y={0} class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			{#snippet children({ widget, component, componentProps })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

## Considerations

Free-form grids have some main considerations:

- When creating a FlexiWidget that is part of a free-form grid, you must explicitly specify an `x` and `y` prop (zero-indexed). Due to the sparse nature of the grid, Flexiboards is not designed to automatically infer a position to drop the widget at.
- You can only have up to 32 columns in a free-form grid (any `maxColumns` value greater than 32 will be ignored). This is because under the hood, Flexiboards uses 32-bit bitmaps to track free-form layouts.

## More Examples

If you would like to see any further examples of free-form grids in action, be sure to check out the open-source [Dashboard](/examples/dashboard) and [Numbers](/examples/numbers) examples, which are both built using free-form grids.
