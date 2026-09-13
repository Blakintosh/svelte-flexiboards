---
title: Overview
description: Install Flexiboards and create a board with movable widgets.
category: Introduction
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import Only from '$lib/components/docs/only.svelte';
	import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

Build a board with one grid and two widgets. Drag A or B to another cell, or focus a widget and press Enter, use the arrow keys until the preview reaches another cell, and press Enter again to drop it.

## Installation

Start with an existing application in your selected framework. Choose a package manager in the command below; the remaining install commands use that choice.

<Only svelte>

<InstallCommand package="@flexiboards/svelte" />

Use Svelte 5.20 or later in the Svelte 5 release line.

</Only>

<Only react>

<InstallCommand package="@flexiboards/react" />

Use React 18 or 19. Boards also support [server-side rendering](/docs/guides/server-side-rendering).

</Only>

## Create a board

This example includes its sizing and styles. It needs no CSS framework. Put it in a component and render that component in your application.

<Only svelte>

```svelte example title="First board"
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiBoard>
	<FlexiTarget
		key="main"
		config={{
			layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 2, maxRows: 2 },
			columnSizing: '100px',
			rowSizing: '100px'
		}}
	>
		<FlexiWidget x={0} y={0}>
			<div
				style="height: 100%; padding: 16px; border: 1px solid currentColor; box-sizing: border-box;"
			>
				A
			</div>
		</FlexiWidget>
		<FlexiWidget x={1} y={1}>
			<div
				style="height: 100%; padding: 16px; border: 1px solid currentColor; box-sizing: border-box;"
			>
				B
			</div>
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="First board"
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';

export function FirstBoard() {
	return (
		<FlexiBoard>
			<FlexiTarget
				keyName="main"
				config={{
					layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 2, maxRows: 2 },
					columnSizing: '100px',
					rowSizing: '100px'
				}}
			>
				<FlexiWidget x={0} y={0}>
					<div
						style={{
							height: '100%',
							padding: 16,
							border: '1px solid currentColor',
							boxSizing: 'border-box'
						}}
					>
						A
					</div>
				</FlexiWidget>
				<FlexiWidget x={1} y={1}>
					<div
						style={{
							height: '100%',
							padding: 16,
							border: '1px solid currentColor',
							boxSizing: 'border-box'
						}}
					>
						B
					</div>
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

The target has two columns and two rows, each 100 pixels. Widget positions are zero-based: A starts at column 0, row 0; B starts at column 1, row 1. Set B's `x` to `0` before mounting to start it beneath A.

## Anatomy of a Flexiboard

- `FlexiBoard` owns the interaction state and isolates its targets. Widgets move between targets within one board.
- `FlexiTarget` defines a grid and holds its widgets. Choose a [free-form grid](/docs/free-form-grids) for positions or a [flow grid](/docs/flow-grids) for an ordered collection.
- `FlexiWidget` registers a widget in its target. Pass children for inline content, or use a component to reuse a renderer. See [Widget rendering](/docs/widget-rendering).

A board can contain several targets. In this diagram, one target contains one widget and the other contains two:

<FlexiBoardAnatomy alt="Component anatomy: a FlexiBoard contains two FlexiTarget grids side by side. The first target holds one FlexiWidget; the second holds two widgets stacked vertically." />

Follow [Multiple targets](/docs/multiple-targets) to build a board with several columns and move widgets between them.

## Example styling

The first board above uses inline CSS. Many later demos use Tailwind utility classes and shadcn theme variables to make widget states visible. Their layout behavior does not require those tools. To reproduce their appearance, configure the [theme setup for your framework](/docs/guides/registry#your-theme-your-source), or replace the utility classes with your own CSS. You do not need to install registry components to use the core board components.

<Only react>

Examples that import `clsx` also require that package:

<InstallCommand package="clsx" />

</Only>

When a guide imports an application component or shows a configuration excerpt, keep the named setup from that guide. Copied registry examples require the installation command on their page.
