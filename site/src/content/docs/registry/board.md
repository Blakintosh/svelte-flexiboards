---
title: Board
description: Themed primitives for custom grids and multiple drop targets.
category: Registry components
published: true
---

<script lang="ts">
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
 import Only from '$lib/components/docs/only.svelte';
 import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

Use `Board.Root`, `Target`, and `Item` when a single dashboard or list preset is too restrictive. Targets share one board, so widgets can move between them.

## Preview

<Only svelte>

```svelte example
<script lang="ts">
	import * as Board from '$lib/components/flexi-board';
	const targetConfig = {
		layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append', columns: 1 }
	} as const;
</script>

<Board.Root class="grid w-full gap-4 sm:grid-cols-2">
	<Board.Target key="planned" config={targetConfig}>
		{#snippet header()}<h3 class="mb-3 text-sm font-medium">Planned</h3>{/snippet}
		<Board.Item class="flex items-center gap-2 p-3"
			><Board.Grabber label="Move write the docs" /><span class="text-sm">Write the docs</span
			></Board.Item
		>
	</Board.Target>
	<Board.Target key="ready" config={targetConfig}>
		{#snippet header()}<h3 class="mb-3 text-sm font-medium">Ready</h3>{/snippet}
		<Board.Item class="flex items-center gap-2 p-3"
			><Board.Grabber label="Move record the demo" /><span class="text-sm">Record the demo</span
			></Board.Item
		>
	</Board.Target>
</Board.Root>
```

</Only>

<Only react>

```tsx example
'use client';
import * as Board from '@/components/flexi-board';
const targetConfig = {
	layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append', columns: 1 }
} as const;

export function BoardDemo() {
	return (
		<Board.Root className="grid w-full gap-4 sm:grid-cols-2">
			<Board.Target
				keyName="planned"
				config={targetConfig}
				header={<h3 className="mb-3 text-sm font-medium">Planned</h3>}
			>
				<Board.Item className="flex items-center gap-2 p-3">
					<Board.Grabber label="Move write the docs" />
					<span className="text-sm">Write the docs</span>
				</Board.Item>
			</Board.Target>
			<Board.Target
				keyName="ready"
				config={targetConfig}
				header={<h3 className="mb-3 text-sm font-medium">Ready</h3>}
			>
				<Board.Item className="flex items-center gap-2 p-3">
					<Board.Grabber label="Move record the demo" />
					<span className="text-sm">Record the demo</span>
				</Board.Item>
			</Board.Target>
		</Board.Root>
	);
}
```

</Only>

## Installation

Start with a Tailwind project configured for shadcn and its theme variables. This copies editable source into your components directory; it does not install a second theme.

<Only svelte>

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-board.json" />

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-board.json" />

</Only>

## API

| Part                  | Underlying API                                                        | Defaults                                                                     |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Root`                | [FlexiBoard](/docs/components/board)                                  | Theme foreground; widgets fully draggable.                                   |
| `Target`              | [FlexiTarget](/docs/components/target)                                | Muted, bordered container; padded grid with a minimum drop area and `gap-3`. |
| `Item`                | [FlexiWidget](/docs/components/widget)                                | Card surface, border, radius, and grabbed/shadow styles.                     |
| `Grabber` / `Resizer` | [Grabber](/docs/registry/grabber) / [Resizer](/docs/registry/resizer) | Labeled, focus-visible handle buttons.                                       |

Props pass through to the underlying primitive. <FrameworkText svelte="Controller bindings and onfirstcreate callbacks remain available." react="The onfirstcreate callback remains available for controller access." /> Item class functions receive the widget controller.

## Choosing a layout

Configure each target with a [flow grid](/docs/flow-grids) or a [free-form grid](/docs/free-form-grids). Use unique, stable target keys for persistence. Set the target identifier with <FrameworkText svelte="key" react="keyName" code />.

Style the outer target with <FrameworkText svelte="containerClass" react="containerClassName" code />; <FrameworkText svelte="class" react="className" code /> styles the grid itself. Put target headings in the `header` <FrameworkText svelte="snippet" react="prop" /> so they are rendered outside the widget declarations.

## Behavior

The source wrappers add styling, not another state model. Use the existing `canDrop`, widget defaults, layout callbacks, and controller APIs for application rules. Explicit configuration overrides the wrappers’ defaults.

Resizing is opt-in here: set `resizability="both"` on an item (or through widget defaults) and add a Resizer. Dashboard enables it for you.

## Components, not blocks

This is deliberately not a Kanban application or a full dashboard shell. Compose these components into your own product; larger copyable blocks can build on the same parts later.
