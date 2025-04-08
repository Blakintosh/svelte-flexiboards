---
title: Flow Grids
description: Learn how to use flow grids for Kanban and ordered layouts.
category: Guides
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import FlowExample from '$lib/components/docs/flow-grids/flow-example.svelte';
	import Flow2DExample from '$lib/components/docs/flow-grids/flow-2d-example.svelte';
</script>

_**NOTE:** In v0.1, there was ambiguity with the use of the `baseRows` and `baseColumns` properties (stored on the target's configuration) and use of values stored on the `layout` object. A breaking change has been made to the library meaning that `baseRows` and `baseColumns` are now deprecated. Additionally, the `disallowExpansion` property has been deprecated in favour of `maxFlowAxis`._

_These properties will be removed in v0.3. Use `layout.rows` and `layout.columns` instead to set the initial size of the grid, and set `maxFlowAxis` to your row count to disable grid expansion._

## Introduction

Flow grids are a _dense_ grid layout, where widgets are placed relative to each other in an ordered manner. The configuration of the flow grid then determines the layout of the ordered widgets.

The `layout` property of a `FlexiTarget`'s configuration (see [FlexiTarget](/docs/components/target)) allows you to define a FlexiTarget that uses a flow layout. It is an object with the following properties:

```ts
export type FlowTargetLayout = {
	type: 'flow';
	placementStrategy: 'append' | 'prepend';
	disallowInsert?: boolean;
	flowAxis: 'row' | 'column';
	disallowExpansion?: boolean;
	maxFlowAxis?: number;
	rows?: number;
	columns?: number;
};
```

- `type`: The type of layout to use, where `flow` defines a flow grid.
- `placementStrategy`: The strategy to use when placing widgets without coordinates into the grid (or when insertion is disallowed).
  - When set to `append`, widgets will be added to the end of the grid (default).
  - When set to `prepend`, widgets will be added to the beginning of the grid.
- `disallowInsert`: When set to `true`, widgets dropped in the grid will not be inserted based on the pointer position, and instead will use the `placementStrategy`.
- `flowAxis`: The axis that widgets are placed along.
- `maxFlowAxis`: The maximum number of widgets that can be placed along the flow axis.
- `rows`: The number of rows that the grid should have.
- `columns`: The number of columns that the grid should have.

## Example

The following code creates us a basic free-form grid with a non-expandable 2x2 layout:

```svelte
<FlexiBoard class="size-96 rounded-xl border p-8">
	<FlexiTarget
		class={'h-full w-full gap-8'}
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

(Styles added for clarity)

This gives us:
<FlowExample />

## Extension to 2D

Flow grids can also enforce an ordered layout that spans two dimensions. When the cross dimension (in the opposite direction to your flow direction, i.e. columns for row flow and rows for column flow) is greater than `1`, this occurs.

In this scenario, widgets will attempt to fill the cross dimension as much as possible, but they will also respect the order they've been put in. For example, in row flow, if a widget is unable to fit within its current row, it will leave a gap and span to the next row instead.

The below example demonstrates this behaviour, where we have a row flow grid with widgets of varying widths. Notice how widget `B` of width `2` is always placed on its own row, because when placed after `A` or `C` of width `1`, it would not fit besides them on the grid.

```svelte
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

<FlexiBoard class="size-96 rounded-xl border p-8">
	<FlexiTarget
		class={'h-full w-full gap-8'}
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
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			A
		</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground" width={2}>
			B
		</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			C
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

Giving us:

<Flow2DExample />

## Considerations

Flow grids have some main considerations:

- When providing the dimensions of a FlexiWidget that is part of a flow grid, any flow-axis dimension (width for column flow, height for row flow) provided is ignored. The flow-axis dimension is fixed to 1 in order to provide a consistent experience.
- However, when row/column sizing is set to `auto` or similar, you can have FlexiWidgets of different sizes on the flow axis, and the sizing of that cell will adjust for it.

## More Examples

If you would like to see any further examples of flow grids in action, be sure to check out the open-source [Notes](/examples/notes) (1D with nesting) and [Flow](/examples/flow) (2D) examples, which are built using flow grids.

_NB: If you have a better idea for an 2D flow grid example than 'Flow', please reach out and let us know! We'd love to have cool, real-world examples of Flexiboards in action._
