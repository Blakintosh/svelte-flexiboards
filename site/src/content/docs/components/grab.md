---
title: FlexiGrab
description: A grab handle for a widget. Use it when only part of a widget should start a drag, leaving the rest free for buttons, links, and text selection.
category: Components
published: true
---

<script lang="ts">
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/flexi-grab.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## FlexiGrab (component)

<ApiProps {api} />

`FlexiGrab` renders a `button` inside a `FlexiWidget`. Once a widget contains at least one `FlexiGrab`, only its grab handles start a drag; pointer events elsewhere on the widget behave normally. The button is disabled while the widget's `draggability` is not `'full'`.

<Only svelte>

```svelte example title="Grab handle"
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget, FlexiGrab } from '@flexiboards/svelte';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';
</script>

<FlexiBoard class="w-72 rounded-xl border p-6 lg:w-96">
	<FlexiTarget
		class="gap-3"
		config={{ layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' } }}
	>
		{#each ['Only the handle drags me', 'Select my text freely'] as label}
			<FlexiWidget
				class={(widget) => [
					'flex items-center gap-3 rounded-lg bg-muted px-3 py-2',
					widget.isShadow && 'opacity-50'
				]}
			>
				<FlexiGrab class="rounded p-1 hover:bg-background">
					<GripVertical class="size-4" />
					<span class="sr-only">Move widget</span>
				</FlexiGrab>
				<span>{label}</span>
			</FlexiWidget>
		{/each}
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="Grab handle"
import { FlexiBoard, FlexiTarget, FlexiWidget, FlexiGrab } from '@flexiboards/react';
import { clsx } from 'clsx';
import { GripVertical } from 'lucide-react';

export function GrabHandles() {
	return (
		<FlexiBoard className="w-72 rounded-xl border p-6 lg:w-96">
			<FlexiTarget
				className="gap-3"
				config={{ layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' } }}
			>
				{['Only the handle drags me', 'Select my text freely'].map((label) => (
					<FlexiWidget
						key={label}
						className={(widget) =>
							clsx('flex items-center gap-3 rounded-lg bg-muted px-3 py-2', widget.isShadow && 'opacity-50')
						}
					>
						<FlexiGrab className="rounded p-1 hover:bg-background">
							<GripVertical className="size-4" />
							<span className="sr-only">Move widget</span>
						</FlexiGrab>
						<span>{label}</span>
					</FlexiWidget>
				))}
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

`FlexiGrab` has no controller of its own. Inside its content you receive the surrounding widget's controller, so the handle can reflect the widget's state:

<Only svelte>

```svelte
<FlexiGrab>
	{#snippet children({ widget })}
		<GripVertical class={widget.isGrabbed ? 'text-primary' : undefined} />
	{/snippet}
</FlexiGrab>
```

</Only>

<Only react>

```tsx
<FlexiGrab>{({ widget }) => <GripVertical className={widget.isGrabbed ? 'text-primary' : undefined} />}</FlexiGrab>
```


`className` may also be a function of the widget (`className={(widget) => widget.isGrabbed ? 'ring-2' : ''}`), re-evaluated as the widget's state changes.

</Only>

## Accessibility

- The handle is a native `button`, so it is focusable with <kbd>Tab</kbd> and disabled when the widget cannot be grabbed.
- Give it a text label. An icon-only handle should contain a visually hidden `span` (for example, Tailwind's `sr-only`) reading "Move widget".
- Once a widget has a grab handle, the widget itself is no longer focusable, and keyboard grabbing moves to the handle: <kbd>Enter</kbd> grabs, the arrow keys move, <kbd>Enter</kbd> drops, <kbd>Escape</kbd> cancels. See [Accessibility](/docs/accessibility) for the full keyboard model.

## Gotchas

- A `FlexiGrab` must be rendered inside a `FlexiWidget`. Outside one, it throws.
- The handle sets `touch-action: none` on itself so touch drags start immediately. Keep it small, or scrolling on touch devices becomes hard when a finger lands on it.
