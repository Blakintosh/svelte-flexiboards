---
title: Registry (preview)
description: Add ready-made Flexiboards pieces to a shadcn-svelte project with one command.
category: Guides
published: true
---

<script lang="ts">
	import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

Flexiboards publishes a small [shadcn-svelte registry](https://www.shadcn-svelte.com/docs/registry). The items are copied into your project as source, so they use your theme tokens and you can change them. This is a preview: Svelte only, two items, and the shapes may still move.

## Handles

Grab and resize handles for a widget, as `Grabber` and `Resizer` components.

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://svelte-flexiboards.vercel.app/r/flexi-handles.json" />

```svelte
<FlexiWidget class="flex items-center gap-2 rounded-lg border p-2">
	<Grabber />
	<span class="flex-1">Only the handle drags this row</span>
	<Resizer />
</FlexiWidget>
```

## Sortable list

A reorderable list of rows with grab handles. Pass `items` with an `id` and a `label`, and read the new order from `onreorder` after every drop. It pulls the handles in as a dependency.

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://svelte-flexiboards.vercel.app/r/flexi-sortable-list.json" />

```svelte
<script lang="ts">
	import SortableList from '$lib/components/flexi-sortable-list/sortable-list.svelte';

	let items = $state([
		{ id: 'a', label: 'Write the docs' },
		{ id: 'b', label: 'Record the demo' },
		{ id: 'c', label: 'Ship it' }
	]);
</script>

<SortableList {items} onreorder={(ids) => console.log(ids)} />
```

## What each item installs

| Item                  | Files                              | Depends on                                                |
| --------------------- | ---------------------------------- | --------------------------------------------------------- |
| `flexi-handles`       | `grabber.svelte`, `resizer.svelte` | `@flexiboards/svelte`, `@lucide/svelte`, the `utils` item |
| `flexi-sortable-list` | `sortable-list.svelte`             | the handles item                                          |

The registry index is at [/r/registry.json](/r/registry.json). React items and a versioned registry are next, once the shapes settle.
