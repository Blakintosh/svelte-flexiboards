---
title: Responsive Layouts
description: Learn how to create responsive dashboards that adapt to different screen sizes.
category: Guides
published: true
---

<script>
	import Callout from '$lib/components/docs/callout.svelte';
</script>

## Introduction

The `ResponsiveFlexiBoard` component wraps your board and manages different layouts for different viewport sizes. Each breakpoint can have its own widget arrangement, and layouts are automatically persisted per breakpoint.

<Callout variant="info" title="Independence">
Each breakpoint of a responsive Flexiboard creates an independent Flexiboard that conditionally renders based on the viewport width. This means operations such as resize, move, add and remove only apply to the current breakpoint Flexiboard that is rendering.

For example, if you had a default and `lg` Flexiboard, deleting a widget in the `lg` Flexiboard (when it's rendering) would not also be deleted in the default one.
</Callout>

## Shared Layout with Breakpoint Parameter

The simplest approach is to use a single `children` snippet that receives the current breakpoint:

```svelte
<script lang="ts">
	import {
		ResponsiveFlexiBoard,
		FlexiBoard,
		FlexiTarget
	} from 'svelte-flexiboards';
</script>

<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024, md: 768 } }}>
	{#snippet children({ currentBreakpoint })}
		<FlexiBoard>
			<FlexiTarget
				key="main"
				config={{
					layout: {
						type: 'free',
						columns: currentBreakpoint === 'lg' ? 4 : currentBreakpoint === 'md' ? 3 : 2
					}
				}}
			/>
		</FlexiBoard>
	{/snippet}
</ResponsiveFlexiBoard>
```

This approach works well when you want the same board structure but with different column counts or sizing.

## Independent Layouts Per Breakpoint

For more control, define separate snippets for each breakpoint. This lets you use entirely different board structures:

```svelte
<ResponsiveFlexiBoard
	config={{
		breakpoints: { lg: 1024 },
		loadLayouts: () => ({
			lg: {
				main: [
					{ type: 'chart', x: 0, y: 0, width: 2, height: 2 },
					{ type: 'stats', x: 2, y: 0, width: 1, height: 1 }
				]
			},
			default: {
				main: [
					{ type: 'chart', x: 0, y: 0, width: 2, height: 2 },
					{ type: 'stats', x: 0, y: 2, width: 2, height: 1 }
				]
			}
		})
	}}
>
	{#snippet lg()}
		<FlexiBoard config={boardConfig}>
			<FlexiTarget
				key="main"
				config={{ layout: { type: 'free', columns: 3 } }}
			/>
		</FlexiBoard>
	{/snippet}

	{#snippet children({ currentBreakpoint })}
		<FlexiBoard config={boardConfig}>
			<FlexiTarget
				key="main"
				config={{ layout: { type: 'free', columns: 2 } }}
			/>
		</FlexiBoard>
	{/snippet}
</ResponsiveFlexiBoard>
```

## Supported Breakpoints

You can define breakpoints for these keys:

| Snippet | Description |
|---------|-------------|
| `lg` | Large screens |
| `md` | Medium screens |
| `sm` | Small screens |
| `xs` | Extra-small screens |

A default breakpoint (which uses the `children` snippet) always implicitly exists, and is used if no breakpoint is matched.

Breakpoints are defined as minimum viewport widths. They're evaluated largest-first, and the first match wins:

```typescript
breakpoints: {
	lg: 1200,  // viewport >= 1200px uses lg
	md: 900,   // viewport >= 900px uses md
	sm: 600    // viewport >= 600px uses sm
	// < 600px falls back to children (or 'default' breakpoint)
}
```

You don't need to define all breakpoints. If only `lg` and `children` are defined, `lg` is used for large screens and `children` for everything else.

## Import & Export

When using `ResponsiveFlexiBoard`, use the responsive controller's `importLayout()` and `exportLayout()` methods instead of the inner `FlexiBoard`'s methods:

```svelte
<script lang="ts">
	import { ResponsiveFlexiBoard, type ResponsiveFlexiBoardController } from 'svelte-flexiboards';

	let responsiveBoard: ResponsiveFlexiBoardController;

	function save() {
		const layouts = responsiveBoard.exportLayout();
		localStorage.setItem('layouts', JSON.stringify(layouts));
	}
</script>

<ResponsiveFlexiBoard bind:controller={responsiveBoard} config={...}>
	<!-- ... -->
</ResponsiveFlexiBoard>
```

The responsive controller manages layouts for all breakpoints together. Calling the methods on the inner `FlexiBoard` directly will log a warning.

## Auto-Persistence

For automatic saving, use `loadLayouts` and `onLayoutsChange`:

```svelte
<ResponsiveFlexiBoard
	config={{
		breakpoints: { lg: 1024 },
		loadLayouts: () => {
			const saved = localStorage.getItem('layouts');
			return saved ? JSON.parse(saved) : undefined;
		},
		onLayoutsChange: (layouts) => {
			localStorage.setItem('layouts', JSON.stringify(layouts));
		}
	}}
>
	<!-- ... -->
</ResponsiveFlexiBoard>
```

As with importing / exporting layouts, prefer the use of these methods over the individual `FlexiBoard`'s methods when using a responsive board.

**Note:** Layouts are lazily initialized. If a user never visits a particular breakpoint, no layout is stored for it. The `onLayoutsChange` callback only includes breakpoints that have been actively used.
