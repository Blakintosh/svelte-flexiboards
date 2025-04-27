---
title: Multiple Targets
description: Learn how to drag and drop widgets between different FlexiTarget dropzones.
category: Guides
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import FlowExample from '$lib/components/docs/flow-grids/flow-example.svelte';
	import Flow2DExample from '$lib/components/docs/flow-grids/flow-2d-example.svelte';
</script>

## Introduction

In many cases, your dashboard or Kanban board needs to be able to support dropping widgets across different categories -- or zones -- on the board.

For example, let's suppose that we have a Kanban board. In its simplest form, we have one list of widgets for the Backlog, another list for the Work-in-Progress, and one more for the Done tasks.

![Kanban board with multiple targets](/img/multiple_targets_kanban.png)

Here, using just one FlexiTarget for our Kanban board wouldn't be enough, as we have three different [Flow layouts](/docs/flow-grids) to maintain. However, due to the board structure that Flexiboards supports (see [Overview](/docs/overview)), we can have multiple FlexiTargets within the same FlexiBoard.

## Using Multiple Targets

To add a second target, simply create an additional `FlexiTarget` component inside of your `FlexiBoard`. Each `FlexiTarget` has its own configuration, so you can adjust how the layouts behave of one another if you desire.

However, you can also use the `targetDefaults` property on the `FlexiBoard` configuration object if you want all targets to have consistent behaviour.

The below example demonstrates us creating the Kanban board that we desired earlier.

```svelte example
<script>
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';

	const targetClass = 'w-64 lg:w-48 border rounded-md p-3 min-h-48 lg:min-h-72';
	const gridClass = 'gap-2';
</script>

<FlexiBoard
	config={{
		targetDefaults: {
			layout: {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			}
		},
		widgetDefaults: {
			draggable: true,
			className: (widget) => [
				'bg-muted px-4 py-2 rounded-lg w-full text-base',
				widget.isShadow && 'opacity-50',
				widget.isGrabbed && 'animate-pulse opacity-50'
			]
		}
	}}
	class={'flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center'}
>
	<div class={targetClass}>
		<h4 class="mb-2 text-base font-semibold text-foreground">Backlog</h4>
		<FlexiTarget key={'backlog'} class={gridClass}>
			<FlexiWidget>Export and Import Layouts</FlexiWidget>
			<FlexiWidget>Animations</FlexiWidget>
		</FlexiTarget>
	</div>

	<div class={targetClass}>
		<h4 class="mb-2 text-base font-semibold text-foreground">Work-in-Progress</h4>
		<FlexiTarget
			key={'wip'}
			class={gridClass}
			config={{
				layout: {
					type: 'flow',
					flowAxis: 'row',
					placementStrategy: 'append',
					maxFlowAxis: 2
				}
			}}
		>
			<FlexiWidget>Fix Flow Grids</FlexiWidget>
		</FlexiTarget>
	</div>

	<div class={targetClass}>
		<h4 class="mb-2 text-base font-semibold text-foreground">Done</h4>
		<FlexiTarget key={'done'} class={gridClass}>
			<FlexiWidget>Write Multiple Targets Guide</FlexiWidget>
		</FlexiTarget>
	</div>
</FlexiBoard>
```

Notice how by adding additional `FlexiTarget` components, we can now drag and drop widgets within their current target, as well as drop them into the other two.

## Advanced: Mixing Grids

We've seen how we can drag and drop widgets between multiple target dropzones of the same grid type, where each in our example was a [Flow Grid](/docs/flow-grids). However, what if we wanted to drag and drop widgets between a Flow Grid and a [Free-Form Grid](/docs/free-form-grids)?

Flexiboards is designed to provide common drag-and-drop logic, regardless of the grid type being used by the target dropzone. This means that dropping widgets between two different grid types is also seamless\*.

```svelte example
<script>
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';

	const targetClass = 'w-64 lg:w-48 border rounded-md p-3 min-h-48 lg:min-h-72';
	const gridClass = 'gap-2';
</script>

<FlexiBoard
	class={'flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center'}
>
	<div class={targetClass}>
		<h4 class="mb-2 text-base font-semibold text-foreground">List Representation</h4>
		<FlexiTarget
			key={'flow'}
			class={gridClass}
			config={{
				layout: {
					type: 'flow',
					flowAxis: 'row',
					placementStrategy: 'append'
				},
				widgetDefaults: {
					draggable: true,
					className: (widget) => [
						'bg-blue-700 text-white px-4 py-2 rounded-lg w-full text-base',
						widget.isShadow && 'opacity-50',
						widget.isGrabbed && 'animate-pulse opacity-50'
					]
				}
			}}
		>
			<FlexiWidget>A</FlexiWidget>
			<FlexiWidget>B</FlexiWidget>
		</FlexiTarget>
	</div>

	<div class={targetClass}>
		<h4 class="mb-2 text-base font-semibold text-foreground">Grid Representation</h4>
		<FlexiTarget
			key={'free'}
			class={gridClass}
			config={{
				rowSizing: '4rem',
				layout: {
					type: 'free',
					minRows: 2,
					minColumns: 2,
					maxRows: 2,
					maxColumns: 2
				},
				widgetDefaults: {
					className: 'bg-red-700 text-white px-4 py-2 rounded-lg text-base w-16'
				}
			}}
		>
			<FlexiWidget x={0} y={0}>C</FlexiWidget>
			<FlexiWidget x={1} y={1} height={1}>D</FlexiWidget>
		</FlexiTarget>
	</div>
</FlexiBoard>
```

Notice that when the widget switches between the two grids, its background colour changes automatically to reflect the `widgetDefaults` of the grid it is in. This is part of the magic of runes, and [Cascading Configuration](/docs/configuration#cascading-configuration)! 😎

_\*Please note: currently, when mixing grid types, you will lose the flow dimension (ie, it will change to 1) when dragging a widget from a free-grid into a flow-grid._

_This is considered a limitation in the current Flexiboards version, and it will not behave this way in future versions._

_The future intended design is for flow grids to enforce a 1 flow dimension size without actually changing the widget's flow dimension (height, in this case). So if that widget is then dropped into the free-grid again, it will have its original height._

## Examples

The open-source [Notes](/examples/notes) example contains a nested FlexiBoard that creates a Kanban board, which you can use for reference. FlexiBoards can be nested inside FlexiBoards and will act independently -- a FlexiWidget inside a nested FlexiBoard cannot be moved into the outer FlexiBoard.
