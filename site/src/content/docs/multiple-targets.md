---
title: Multiple Targets
description: Learn how to drag and drop widgets between different FlexiTarget dropzones.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

## Introduction

In many cases, your dashboard or Kanban board needs to support dropping widgets across different categories, or zones, on the board.

Suppose we have a Kanban board. In its simplest form, we have one list of widgets for the Backlog, another list for the Work-in-Progress, and one more for the Done tasks.

![Kanban board with multiple targets](/img/multiple_targets_kanban.png)

Here, one FlexiTarget for our Kanban board wouldn't be enough, as we have three different [Flow layouts](/docs/flow-grids) to maintain. The board structure that Flexiboards supports (see [Overview](/docs/overview)) lets us put multiple FlexiTargets within the same FlexiBoard.

## Using multiple targets

To add a second target, create another `FlexiTarget` component inside of your `FlexiBoard`. Each `FlexiTarget` has its own configuration, so you can adjust how the layouts behave of one another if you desire.

You can also use the `targetDefaults` property on the `FlexiBoard` configuration object if you want all targets to have consistent behaviour.

The example below builds the Kanban board we described earlier.

<Only svelte>

```svelte example
<script>
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';

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
			draggability: 'full',
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

</Only>

<Only react>

```tsx example
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';

const targetClass = 'w-64 lg:w-48 border rounded-md p-3 min-h-48 lg:min-h-72';
const gridClass = 'gap-2';

export function KanbanBoard() {
	return (
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
					draggability: 'full',
					className: (widget: FlexiWidgetController) =>
						clsx(
							'bg-muted px-4 py-2 rounded-lg w-full text-base',
							widget.isShadow && 'opacity-50',
							widget.isGrabbed && 'animate-pulse opacity-50'
						)
				}
			}}
			className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center"
		>
			<div className={targetClass}>
				<h4 className="mb-2 text-base font-semibold text-foreground">Backlog</h4>
				<FlexiTarget keyName="backlog" className={gridClass}>
					<FlexiWidget>Export and Import Layouts</FlexiWidget>
					<FlexiWidget>Animations</FlexiWidget>
				</FlexiTarget>
			</div>

			<div className={targetClass}>
				<h4 className="mb-2 text-base font-semibold text-foreground">Work-in-Progress</h4>
				<FlexiTarget
					keyName="wip"
					className={gridClass}
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

			<div className={targetClass}>
				<h4 className="mb-2 text-base font-semibold text-foreground">Done</h4>
				<FlexiTarget keyName="done" className={gridClass}>
					<FlexiWidget>Write Multiple Targets Guide</FlexiWidget>
				</FlexiTarget>
			</div>
		</FlexiBoard>
	);
}
```

Note the two naming differences from the Svelte adapter: `FlexiTarget` takes `keyName` rather than `key` (since `key` is reserved by React), and every class prop is `className`. `FlexiTarget` also accepts `containerClassName`, which styles the element wrapping the grid, so the outer `div`s above could be folded into the targets themselves if you prefer.

</Only>

With the extra `FlexiTarget` components in place, we can drag and drop widgets within their current target, as well as drop them into the other two.

## Advanced: mixing grids

We've seen how we can drag and drop widgets between multiple target dropzones of the same grid type, where each in our example was a [Flow Grid](/docs/flow-grids). But what if we wanted to drag and drop widgets between a Flow Grid and a [Free-Form Grid](/docs/free-form-grids)?

Flexiboards applies the same drag-and-drop logic whatever grid type the target dropzone uses. Dropping widgets between two different grid types works the same way.

<Only svelte>

```svelte example
<script>
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';

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
					draggability: 'full',
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

</Only>

<Only react>

```tsx example
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';

const targetClass = 'w-64 lg:w-48 border rounded-md p-3 min-h-48 lg:min-h-72';
const gridClass = 'gap-2';

export function MixedGridsBoard() {
	return (
		<FlexiBoard className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center">
			<div className={targetClass}>
				<h4 className="mb-2 text-base font-semibold text-foreground">List Representation</h4>
				<FlexiTarget
					keyName="flow"
					className={gridClass}
					config={{
						layout: {
							type: 'flow',
							flowAxis: 'row',
							placementStrategy: 'append'
						},
						widgetDefaults: {
							draggability: 'full',
							className: (widget: FlexiWidgetController) =>
								clsx(
									'bg-blue-700 text-white px-4 py-2 rounded-lg w-full text-base',
									widget.isShadow && 'opacity-50',
									widget.isGrabbed && 'animate-pulse opacity-50'
								)
						}
					}}
				>
					<FlexiWidget>A</FlexiWidget>
					<FlexiWidget>B</FlexiWidget>
				</FlexiTarget>
			</div>

			<div className={targetClass}>
				<h4 className="mb-2 text-base font-semibold text-foreground">Grid Representation</h4>
				<FlexiTarget
					keyName="free"
					className={gridClass}
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
					<FlexiWidget x={0} y={0}>
						C
					</FlexiWidget>
					<FlexiWidget x={1} y={1} height={1}>
						D
					</FlexiWidget>
				</FlexiTarget>
			</div>
		</FlexiBoard>
	);
}
```

</Only>

Notice that when the widget switches between the two grids, its background colour changes automatically to reflect the `widgetDefaults` of the grid it is in. That's [Cascading Configuration](/docs/configuration#cascading-configuration) at work. The widget resolves each unspecified property from its nearest ancestor, and its nearest ancestor has changed.

## Examples

The [Notes](/examples/notes) example nests a Kanban board inside another board. Boards nest independently: a widget inside the inner board cannot be moved into the outer one.

## Gotchas

- **Flow grids reset the flow-axis size.** A widget dragged from a free-form grid into a flow grid has its flow-axis dimension (height, for row flow) set to 1, and keeps that size if dragged back out. Store the original size in `metadata` if you need to restore it.
- **Widgets cannot cross boards.** Two `FlexiBoard`s on one page are separate drag-and-drop environments.
