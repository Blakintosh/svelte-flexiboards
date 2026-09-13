---
title: Sortable List
description: Reorder custom rows with handles, keyboard controls, and order callbacks.
category: Registry components
published: true
---

<script lang="ts">
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
 import Only from '$lib/components/docs/only.svelte';
 import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

Compose `SortableList.Root`, `Item`, and `Grabber`. You own each row’s content: labels, badges, checkboxes, and menus can live alongside the handle.

## Preview

<Only svelte>

```svelte example
<script lang="ts">
	import * as SortableList from '$lib/components/flexi-sortable-list';
	let order = $state(['research', 'prototype', 'release']);
	const tasks = [
		{ id: 'research', title: 'Research', detail: 'Review customer feedback' },
		{ id: 'prototype', title: 'Prototype', detail: 'Explore the interaction' },
		{ id: 'release', title: 'Release', detail: 'Prepare the changelog' }
	];
</script>

<div class="w-full">
	<SortableList.Root onreorder={(ids) => (order = ids)}>
		{#each tasks as task (task.id)}
			<SortableList.Item id={task.id}>
				<SortableList.Grabber label={`Move ${task.title}`} />
				<div class="min-w-0 flex-1">
					<p class="font-medium">{task.title}</p>
					<p class="text-muted-foreground text-sm">{task.detail}</p>
				</div>
			</SortableList.Item>
		{/each}
	</SortableList.Root>
	<p class="text-muted-foreground mt-4 text-sm" aria-live="polite">Order: {order.join(', ')}</p>
</div>
```

</Only>

<Only react>

```tsx example
'use client';
import { useState } from 'react';
import * as SortableList from '@/components/flexi-sortable-list';

const tasks = [
	{ id: 'research', title: 'Research', detail: 'Review customer feedback' },
	{ id: 'prototype', title: 'Prototype', detail: 'Explore the interaction' },
	{ id: 'release', title: 'Release', detail: 'Prepare the changelog' }
];

export function SortableListDemo() {
	const [order, setOrder] = useState(tasks.map((task) => task.id));
	return (
		<div className="w-full">
			<SortableList.Root onReorder={setOrder}>
				{tasks.map((task) => (
					<SortableList.Item key={task.id} id={task.id}>
						<SortableList.Grabber label={`Move ${task.title}`} />
						<div className="min-w-0 flex-1">
							<p className="font-medium">{task.title}</p>
							<p className="text-muted-foreground text-sm">{task.detail}</p>
						</div>
					</SortableList.Item>
				))}
			</SortableList.Root>
			<p className="text-muted-foreground mt-4 text-sm" aria-live="polite">
				Order: {order.join(', ')}
			</p>
		</div>
	);
}
```

</Only>

## Installation

Start with a Tailwind project configured for shadcn and its theme variables. This copies editable source into your components directory; it does not install a second theme.

<Only svelte>

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-sortable-list.json" />

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-sortable-list.json" />

</Only>

## API

| Part      | Props and defaults                                                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Root`    | All [FlexiSortable props](/docs/presets#sortable-list), plus <FrameworkText svelte="onreorder(ids)" react="onReorder(ids)" code />. Vertical by default, with `gap-2`. |
| `Item`    | All [FlexiWidget props](/docs/components/widget), plus a required, unique string `id`. It is stored in `metadata.id` for order reporting.                              |
| `Grabber` | [Grabber props](/docs/registry/grabber), including an accessible `label`.                                                                                              |

Use <FrameworkText svelte="keyed each blocks" react="React keys" /> alongside the item `id`. The item’s `id` wins over a conflicting `metadata.id`.

## Reading the order

The board owns the displayed layout; children declare the items, not a controlled order. The callback reports IDs in layout order after a layout change (including drops, deletion, and programmatic moves), not initial creation or layout import. Store the returned order in your application, or persist the full layout with `config.onLayoutChange`. Both callbacks run when provided.

A custom target key (<FrameworkText svelte="key" react="keyName" code />) is respected by the callback. For multiple lists that exchange items, use [Board](/docs/registry/board) instead of nesting separate roots.

## Customization

Use <FrameworkText svelte="class" react="className" code /> on Root for spacing and on Item for the row surface. Set `direction="horizontal"` for a horizontal list. Underlying sizing and behavior options remain available through `config`, `targetConfig`, and individual widget props.

A handle keeps dragging away from the rest of the row. Place interactive controls beside the handle, not inside it. Resizing is off by default, as rows normally size to their content.

## Existing convenience API

<Only svelte>

The original default export from `sortable-list.svelte` is retained.

</Only>

<Only react>

The original `SortableList` export from `sortable-list.tsx` is retained.

</Only>

It still accepts `items: { id, label }[]` and the reorder callback; new compositions should use the namespace API above.

## Motion

Movement uses short CSS transitions by default and respects reduced motion. [Compare presets or disable transitions](/docs/registry/motion).
