---
title: FlexiResize
description: A resize handle for a widget. Widgets have no resize affordance of their own, so this is how users resize them with a pointer or the keyboard.
category: Components
published: true
---

<script lang="ts">
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/flexi-resize.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## FlexiResize (component)

<ApiProps {api} />

`FlexiResize` renders a `button` inside a `FlexiWidget`. Dragging it resizes the widget along the axes allowed by its `resizability`; the button is disabled while `resizability` is `'none'`. Position it yourself, typically in the widget's bottom-right corner.

<Only svelte>

```svelte example title="Resize handle"
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget, FlexiResize } from '@flexiboards/svelte';
</script>

<FlexiBoard class="size-72 rounded-xl border p-6 lg:size-96">
	<FlexiTarget
		class="h-full w-full gap-3"
		containerClass="h-full w-full"
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: { type: 'free', minRows: 3, minColumns: 3, maxRows: 3, maxColumns: 3 }
		}}
	>
		<FlexiWidget
			x={0}
			y={0}
			resizability="both"
			class={(widget) => [
				'bg-primary text-primary-foreground relative rounded-lg p-3',
				widget.isShadow && 'opacity-50'
			]}
		>
			{#snippet children({ widget })}
				{widget.width} × {widget.height}
				<FlexiResize
					class="absolute bottom-1 right-1 size-4 rounded-sm border-b-2 border-r-2 border-current"
				>
					<span class="sr-only">Resize widget</span>
				</FlexiResize>
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="Resize handle"
import { FlexiBoard, FlexiTarget, FlexiWidget, FlexiResize } from '@flexiboards/react';
import { clsx } from 'clsx';

export function ResizeHandle() {
	return (
		<FlexiBoard className="size-72 rounded-xl border p-6 lg:size-96">
			<FlexiTarget
				className="h-full w-full gap-3"
				containerClassName="h-full w-full"
				config={{
					rowSizing: 'minmax(0, 1fr)',
					layout: { type: 'free', minRows: 3, minColumns: 3, maxRows: 3, maxColumns: 3 }
				}}
			>
				<FlexiWidget
					x={0}
					y={0}
					resizability="both"
					className={(widget) =>
						clsx(
							'bg-primary text-primary-foreground relative rounded-lg p-3',
							widget.isShadow && 'opacity-50'
						)
					}
				>
					{({ widget }) => (
						<>
							{widget.width} × {widget.height}
							<FlexiResize className="absolute bottom-1 right-1 size-4 rounded-sm border-b-2 border-r-2 border-current">
								<span className="sr-only">Resize widget</span>
							</FlexiResize>
						</>
					)}
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

`className` may also be a function of the widget (`className={(widget) => widget.isGrabbed ? 'ring-2' : ''}`), re-evaluated as the widget's state changes.

</Only>

`FlexiResize` has no controller of its own. Its content receives the surrounding widget's controller, so the handle can react to `widget.isResizing`. Limits come from the widget's `minWidth`, `maxWidth`, `minHeight`, and `maxHeight` props; see [FlexiWidget](/docs/components/widget).

## Accessibility

- The handle is a native `button`: focusable with <kbd>Tab</kbd>, disabled when the widget cannot be resized. Give it a visually hidden text label.
- <kbd>Enter</kbd> on the handle starts a keyboard resize, the arrow keys move the resize edge, <kbd>Enter</kbd> confirms, and <kbd>Escape</kbd> cancels. See [Accessibility](/docs/accessibility).

## Gotchas

- A `FlexiResize` must be rendered inside a `FlexiWidget`. Outside one, it throws.
- Give the widget's element `position: relative` (or similar) so an absolutely positioned handle stays inside it.
- In a flow grid the flow-axis dimension is fixed at 1, so only the cross-axis resizes. See [Flow Grids](/docs/flow-grids#considerations).
