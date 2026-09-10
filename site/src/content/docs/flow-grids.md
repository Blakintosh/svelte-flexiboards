---
title: Flow Grids
description: Learn how to use flow grids for Kanban and ordered layouts.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

A flow grid keeps widgets in order and packs them densely, like a list. Set a target's `layout.type` to `'flow'` to get one:

<Only svelte>

```svelte example title="1D Flow Grid"
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
				type: 'flow',
				rows: 4,
				columns: 1,
				placementStrategy: 'append',
				flowAxis: 'row'
			}
		}}
	>
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			{#snippet children({ widget, component, componentProps })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground">
			{#snippet children({ widget, component, componentProps })}
				And I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="1D Flow Grid"
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';

export function FlowGrid() {
	return (
		<FlexiBoard className="size-72 rounded-xl border p-8 lg:size-96">
			<FlexiTarget
				className="h-full w-full gap-4 lg:gap-6"
				containerClassName="w-full h-full"
				config={{
					rowSizing: 'minmax(0, 1fr)',
					layout: {
						type: 'flow',
						rows: 4,
						columns: 1,
						placementStrategy: 'append',
						flowAxis: 'row'
					}
				}}
			>
				<FlexiWidget className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
					{({ widget }) => (
						<>
							I'm at ({widget.x}, {widget.y})
						</>
					)}
				</FlexiWidget>
				<FlexiWidget className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground">
					{({ widget }) => (
						<>
							And I'm at ({widget.x}, {widget.y})
						</>
					)}
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

Both widgets sit in a single column. Drag one onto the other and they swap; drop into an empty cell and the rest reflow to close the gap.

## When to use a flow grid

Use a flow grid when order matters more than position: Kanban columns, sortable lists, and galleries. Widgets never have gaps between them, and a widget dropped into the grid takes an index rather than coordinates. For dashboards where widgets live at fixed coordinates, use a [free-form grid](/docs/free-form-grids).

## Configuring the flow

Three properties shape a flow grid:

- `flowAxis` chooses whether widgets run along rows (`'row'`) or columns (`'column'`).
- `placementStrategy` decides where a widget lands when it is added without a position: `'append'` at the end, `'prepend'` at the start.
- `rows` and `columns` fix the grid's size. Leave one open and the grid grows along the flow axis, capped by `maxFlowAxis` if you set it.

Every property, with its type and default, is in the [FlowTargetLayout reference](/docs/components/target#flowtargetlayout).

## Extension to 2D

When the cross dimension (columns for row flow, rows for column flow) is greater than 1, the flow wraps across it. Widgets fill the cross dimension as far as they can while keeping their order, so a widget that cannot fit in the current row leaves a gap and starts the next one.

Below, widget `B` has a width of 2, so it always takes a row of its own. Placed after `A` or `C`, it would not fit beside them.

<Only svelte>

```svelte example title="2D Flow Grid"
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
				type: 'flow',
				rows: 4,
				columns: 2,
				placementStrategy: 'append',
				flowAxis: 'row'
			}
		}}
	>
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">A</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground" width={2}>
			B
		</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">C</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="2D Flow Grid"
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';

export function FlowGrid2D() {
	return (
		<FlexiBoard className="size-72 rounded-xl border p-8 lg:size-96">
			<FlexiTarget
				className="h-full w-full gap-4 lg:gap-6"
				containerClassName="w-full h-full"
				config={{
					rowSizing: 'minmax(0, 1fr)',
					layout: {
						type: 'flow',
						rows: 4,
						columns: 2,
						placementStrategy: 'append',
						flowAxis: 'row'
					}
				}}
			>
				<FlexiWidget className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">A</FlexiWidget>
				<FlexiWidget className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground" width={2}>
					B
				</FlexiWidget>
				<FlexiWidget className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">C</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

## Examples

The [Notes](/examples/notes) example uses nested 1D flow grids, and [Flow](/examples/flow) is a 2D flow grid.

## Gotchas

- **Flow-axis size is always 1.** A widget's `height` in row flow (or `width` in column flow) is ignored. With `rowSizing` or `columnSizing` set to `auto`, cells still stretch to fit content of different sizes.
- **Drop targets are whole cells.** Dropping onto a widget places the dragged widget after it when moving forwards and before it when moving backwards. Changing side on the same widget needs real pointer travel, so widgets reflowing under a still pointer never flicker.
- **Insertion can be disabled.** Set `disallowInsert: true` and every drop uses `placementStrategy` instead of the pointer position, which suits "add to end" inboxes.
