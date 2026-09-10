---
title: Registry (preview)
description: Add ready-made Flexiboards pieces to a shadcn project with one command.
category: Guides
published: true
---

<script lang="ts">
	import InstallCommand from '$lib/components/docs/install-command.svelte';
	import Only from '$lib/components/docs/only.svelte';
</script>

Flexiboards publishes a small registry in the shadcn format, one for [shadcn-svelte](https://www.shadcn-svelte.com/docs/registry) and one for [shadcn](https://ui.shadcn.com/docs/registry). The items are copied into your project as source, so they use your theme tokens and you can change them. This is a preview: two items per framework, and the shapes may still move.

## Handles

Grab and resize handles for a widget, as `Grabber` and `Resizer` components.

<Only svelte>

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-handles.json" />

```svelte
<FlexiWidget class="flex items-center gap-2 rounded-lg border p-2">
	<Grabber />
	<span class="flex-1">Only the handle drags this row</span>
	<Resizer />
</FlexiWidget>
```

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-handles.json" />

```tsx
<FlexiWidget className="flex items-center gap-2 rounded-lg border p-2">
	<Grabber />
	<span className="flex-1">Only the handle drags this row</span>
	<Resizer />
</FlexiWidget>
```

</Only>

## Sortable list

A reorderable list of rows with grab handles. Pass `items` with an `id` and a `label`, and read the new order from the reorder callback after every drop. It pulls the handles in as a dependency.

<Only svelte>

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-sortable-list.json" />

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

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-sortable-list.json" />

```tsx
import { SortableList } from '@/components/flexi-sortable-list/sortable-list';

const items = [
	{ id: 'a', label: 'Write the docs' },
	{ id: 'b', label: 'Record the demo' },
	{ id: 'c', label: 'Ship it' }
];

export function Todo() {
	return <SortableList items={items} onReorder={(ids) => console.log(ids)} />;
}
```

</Only>

## What each item installs

<Only svelte>

| Item                  | Files                              | Depends on                                                |
| --------------------- | ---------------------------------- | --------------------------------------------------------- |
| `flexi-handles`       | `grabber.svelte`, `resizer.svelte` | `@flexiboards/svelte`, `@lucide/svelte`, the `utils` item |
| `flexi-sortable-list` | `sortable-list.svelte`             | the handles item                                          |

The registry index is at [/r/svelte/registry.json](/r/svelte/registry.json).

</Only>

<Only react>

| Item                  | Files                        | Depends on                                             |
| --------------------- | ---------------------------- | ------------------------------------------------------ |
| `flexi-handles`       | `grabber.tsx`, `resizer.tsx` | `@flexiboards/react`, `lucide-react`, the `utils` item |
| `flexi-sortable-list` | `sortable-list.tsx`          | the handles item                                       |

The registry index is at [/r/react/registry.json](/r/react/registry.json).

</Only>

A versioned registry is next, once the shapes settle.
