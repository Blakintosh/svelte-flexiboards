---
title: Overview
description: Learn how to install Flexiboards and create your first Flexiboard.
category: Introduction
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import FlexiBoardExample from '$lib/components/docs/overview/flexiboard-example.svelte';
	import Only from '$lib/components/docs/only.svelte';
	import InstallCommand from '$lib/components/docs/install-command.svelte';

	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
</script>

## Installation

Flexiboards is on npm. Pick your package manager once and every install command on the site follows it:

<Only svelte>

<InstallCommand package="@flexiboards/svelte" />

Flexiboards was built from the ground up to be a Svelte 5 library, so it is incompatible with Svelte 4 or earlier.

</Only>

<Only react>

<InstallCommand package="@flexiboards/react" />

The React adapter supports React 18 and 19, and is currently in preview: the API mirrors the Svelte adapter, and these docs switch their snippets to React wherever the two differ. Boards render on the server too; see [server-side rendering](/docs/guides/server-side-rendering).

</Only>

## Anatomy of a Flexiboard

A Flexiboard is built from three components: `FlexiBoard`, `FlexiTarget`, and `FlexiWidget`. Together they cover a wide range of drag-and-drop grids.

Below is a diagram showing the anatomy of a Flexiboard that would be used for a todos board.
<FlexiBoardAnatomy />

Here's how you would create a board like this using Flexiboards:

<Only svelte>

```svelte example
<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
</script>

<div class="not-prose">
	<FlexiBoard
		class="flex flex-col justify-center gap-8 lg:flex-row"
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
				className: (widget: FlexiWidgetController) => {
					return [
						'bg-muted px-4 py-2 rounded-lg w-64',
						widget.isShadow && 'opacity-50',
						widget.isGrabbed && 'animate-pulse opacity-50'
					];
				}
			}
		}}
	>
		<div class="rounded-xl border bg-background px-4 py-2">
			<h5 class="mb-4 text-lg font-semibold">Incomplete</h5>
			<FlexiTarget key="todo" class="gap-2">
				<FlexiWidget>Study for exam</FlexiWidget>
				<FlexiWidget>Research for project</FlexiWidget>
			</FlexiTarget>
		</div>

		<div class="rounded-xl border bg-background px-4 py-2">
			<h5 class="mb-4 text-lg font-semibold">Done</h5>
			<FlexiTarget key="done" class="gap-2">
				<FlexiWidget>Purchase eggs</FlexiWidget>
				<FlexiWidget>Recharge car</FlexiWidget>
				<FlexiWidget>Feed the cat</FlexiWidget>
			</FlexiTarget>
		</div>
	</FlexiBoard>
</div>
```

</Only>

<Only react>

```tsx example
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';

export function TodoBoard() {
	return (
		<div className="not-prose">
			<FlexiBoard
				className="flex flex-col justify-center gap-8 lg:flex-row"
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
								'bg-muted px-4 py-2 rounded-lg w-64',
								widget.isShadow && 'opacity-50',
								widget.isGrabbed && 'animate-pulse opacity-50'
							)
					}
				}}
			>
				<div className="rounded-xl border bg-background px-4 py-2">
					<h5 className="mb-4 text-lg font-semibold">Incomplete</h5>
					<FlexiTarget keyName="todo" className="gap-2">
						<FlexiWidget>Study for exam</FlexiWidget>
						<FlexiWidget>Research for project</FlexiWidget>
					</FlexiTarget>
				</div>

				<div className="rounded-xl border bg-background px-4 py-2">
					<h5 className="mb-4 text-lg font-semibold">Done</h5>
					<FlexiTarget keyName="done" className="gap-2">
						<FlexiWidget>Purchase eggs</FlexiWidget>
						<FlexiWidget>Recharge car</FlexiWidget>
						<FlexiWidget>Feed the cat</FlexiWidget>
					</FlexiTarget>
				</div>
			</FlexiBoard>
		</div>
	);
}
```

</Only>

In a Flexiboard, each of these components serves a specific purpose:

- `FlexiBoard` is the main container for the board, creating the drag-and-drop environment. It isolates the targets and widgets; you can have multiple boards on a single page, but widgets cannot be dragged between different FlexiBoards.
- `FlexiTarget` is a dropzone and container for widgets. You can store widgets within it in a customisable layout, and you can move widgets between different FlexiTargets of the same board.
- `FlexiWidget` is the widget itself. You can move it, resize it, and customise it in a number of ways. There are two ways to render its content: pass `children`, or use the `component` prop to render a custom component of your choosing. You can also combine the two, which helps when you want a series of consistent looking widgets that still render their own component.
