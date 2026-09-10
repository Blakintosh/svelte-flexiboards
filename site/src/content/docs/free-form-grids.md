---
title: Free-Form Grids
description: Learn how to use free-form grids for dashboard layouts.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

A free-form grid is a sparse grid: widgets sit at coordinates you choose, and empty cells are allowed. Set a target's `layout.type` to `'free'` to get one:

<Only svelte>

```svelte example title="Free Grid"
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
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
		<FlexiWidget x={0} y={0} class="bg-primary text-primary-foreground rounded-lg px-4 py-2">
			{#snippet children({ widget, component, componentProps })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="Free Grid"
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';

export function FreeGrid() {
	return (
		<FlexiBoard className="size-72 rounded-xl border p-8 lg:size-96">
			<FlexiTarget
				className="h-full w-full gap-4 lg:gap-6"
				containerClassName="w-full h-full"
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
				<FlexiWidget
					x={0}
					y={0}
					className="bg-primary text-primary-foreground rounded-lg px-4 py-2"
				>
					{({ widget }) => (
						<>
							I'm at ({widget.x}, {widget.y})
						</>
					)}
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

The widget starts at `(0, 0)`. Drag it to any of the four cells and it stays there.

## When to use a free-form grid

Use a free-form grid for dashboards and canvases, where each widget has a position and size of its own and gaps are fine. When you want widgets to stay in an order with no gaps, use a [flow grid](/docs/flow-grids).

## Sizing the grid

`minRows` and `minColumns` set the grid's starting size; `maxRows` and `maxColumns` cap how far it can grow as widgets are dragged or resized past the edge. Set a maximum equal to its minimum, as above, to fix that dimension.

Two further options tidy the grid after each change:

- `collapsibility` removes empty rows and columns, either at the edges of the grid or anywhere in it.
- `packing` slides widgets left (`'horizontal'`) or up (`'vertical'`) to close gaps, closest-to-the-edge first.

Every property, with its type and default, is in the [FreeFormTargetLayout reference](/docs/components/target#freeformtargetlayout).

## Examples

The [Dashboard](/examples/dashboard) and [Numbers](/examples/numbers) examples are both free-form grids.

## Gotchas

- **Every widget needs `x` and `y`.** The grid does not infer a position for a widget declared without one. Widgets created by an [adder](/docs/components/adder) or an imported [layout](/docs/guides/exporting-importing-boards) carry their own coordinates.
- **32 columns maximum.** Free-form layouts are tracked as 32-bit bitmaps, so `maxColumns` values above 32 are treated as 32.
- **Pushing, not swapping.** A widget dropped onto an occupied cell pushes the occupants aside if they fit, and the drop is rejected if they do not. The `dropRejected` flag on the widget lets you show this; see [Widget Rendering](/docs/widget-rendering#styling-by-state).
