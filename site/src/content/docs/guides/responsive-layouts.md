---
title: Responsive Layouts
description: Learn how to create responsive dashboards that adapt to different screen sizes.
category: Guides
published: true
---

<script lang="ts">
	import Callout from '$lib/components/docs/callout.svelte';
	import Only from '$lib/components/docs/only.svelte';
</script>

`ResponsiveFlexiBoard` wraps a board and picks a layout for the current viewport width. Each breakpoint keeps its own widget arrangement. The simplest form is one board whose configuration reads the current breakpoint:

<Only svelte>

```svelte example title="Responsive columns"
<script lang="ts">
	import { ResponsiveFlexiBoard, FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';

	const tile = 'flex items-center justify-center rounded-lg bg-primary text-primary-foreground';
</script>

<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024 } }}>
	{#snippet children({ currentBreakpoint })}
		{@const columns = currentBreakpoint === 'lg' ? 3 : 2}
		<FlexiBoard class="w-72 rounded-xl border p-6 lg:w-96">
			<p class="mb-3 text-sm text-muted-foreground">Breakpoint: {currentBreakpoint}, {columns} columns</p>
			<FlexiTarget
				key="main"
				class="gap-3"
				config={{
					rowSizing: '4rem',
					layout: { type: 'free', minRows: 2, minColumns: columns, maxRows: 2, maxColumns: columns }
				}}
			>
				<FlexiWidget x={0} y={0} class={tile}>A</FlexiWidget>
				<FlexiWidget x={1} y={1} class={tile}>B</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	{/snippet}
</ResponsiveFlexiBoard>
```

</Only>

<Only react>

```tsx example title="Responsive columns"
import { ResponsiveFlexiBoard, FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';

const tile = 'flex items-center justify-center rounded-lg bg-primary text-primary-foreground';

export function ResponsiveColumns() {
	return (
		<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024 } }}>
			{({ currentBreakpoint }) => {
				const columns = currentBreakpoint === 'lg' ? 3 : 2;
				return (
					<FlexiBoard className="w-72 rounded-xl border p-6 lg:w-96">
						<p className="mb-3 text-sm text-muted-foreground">
							Breakpoint: {currentBreakpoint}, {columns} columns
						</p>
						<FlexiTarget
							keyName="main"
							className="gap-3"
							config={{
								rowSizing: '4rem',
								layout: { type: 'free', minRows: 2, minColumns: columns, maxRows: 2, maxColumns: columns }
							}}
						>
							<FlexiWidget x={0} y={0} className={tile}>
								A
							</FlexiWidget>
							<FlexiWidget x={1} y={1} className={tile}>
								B
							</FlexiWidget>
						</FlexiTarget>
					</FlexiBoard>
				);
			}}
		</ResponsiveFlexiBoard>
	);
}
```

</Only>

Resize the browser across 1024px: the grid switches between three and two columns. Move a widget at one width, resize, and move it at the other, and each arrangement is remembered separately.

<Callout variant="info" title="Breakpoints are independent">
Each breakpoint renders its own separate Flexiboard. Moving, resizing, adding, or removing widgets only affects the currently active breakpoint; changes don't sync across breakpoints.
</Callout>

## Shared board, breakpoint parameter

The example above uses a single fallback snippet that receives the current breakpoint. This works well when you want the same board structure with different column counts or sizing:

<Only svelte>

```svelte
<script lang="ts">
	import {
		ResponsiveFlexiBoard,
		FlexiBoard,
		FlexiTarget
	} from '@flexiboards/svelte';
</script>

<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024, md: 768 } }}>
	{#snippet children({ currentBreakpoint })}
		<FlexiBoard>
			<FlexiTarget
				key="main"
				config={{
					layout: {
						type: 'free',
						minColumns: currentBreakpoint === 'lg' ? 4 : currentBreakpoint === 'md' ? 3 : 2,
						maxColumns: currentBreakpoint === 'lg' ? 4 : currentBreakpoint === 'md' ? 3 : 2
					}
				}}
			/>
		</FlexiBoard>
	{/snippet}
</ResponsiveFlexiBoard>
```

</Only>

<Only react>

In React, the fallback is `children`. Pass a function to receive the current breakpoint:

```tsx
import { ResponsiveFlexiBoard, FlexiBoard, FlexiTarget } from '@flexiboards/react';

export function Dashboard() {
	return (
		<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024, md: 768 } }}>
			{({ currentBreakpoint }) => (
				<FlexiBoard>
					<FlexiTarget
						keyName="main"
						config={{
							layout: {
								type: 'free',
								minColumns: currentBreakpoint === 'lg' ? 4 : currentBreakpoint === 'md' ? 3 : 2,
								maxColumns: currentBreakpoint === 'lg' ? 4 : currentBreakpoint === 'md' ? 3 : 2
							}
						}}
					/>
				</FlexiBoard>
			)}
		</ResponsiveFlexiBoard>
	);
}
```

</Only>

## Independent boards per breakpoint

For more control, give each breakpoint its own snippet. This lets you use entirely different board structures. `boardConfig` below is a board configuration with a [registry](/docs/guides/exporting-importing-boards#the-registry) for the `chart` and `stats` types:

<Only svelte>

```svelte
<script lang="ts">
	import { ResponsiveFlexiBoard, FlexiBoard, FlexiTarget } from '@flexiboards/svelte';
	import { boardConfig } from './board-config';
</script>

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
				config={{ layout: { type: 'free', minColumns: 3, maxColumns: 3 } }}
			/>
		</FlexiBoard>
	{/snippet}

	{#snippet children({ currentBreakpoint })}
		<FlexiBoard config={boardConfig}>
			<FlexiTarget
				key="main"
				config={{ layout: { type: 'free', minColumns: 2, maxColumns: 2 } }}
			/>
		</FlexiBoard>
	{/snippet}
</ResponsiveFlexiBoard>
```

</Only>

<Only react>

Each breakpoint is a prop taking the element to render: `lg`, `md`, `sm` and `xs`. `children` is the fallback.

```tsx
import { ResponsiveFlexiBoard, FlexiBoard, FlexiTarget } from '@flexiboards/react';
import { boardConfig } from './board-config';

const responsiveConfig = {
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
};

function board(columns: number) {
	return (
		<FlexiBoard config={boardConfig}>
			<FlexiTarget keyName="main" config={{ layout: { type: 'free', minColumns: columns, maxColumns: columns } }} />
		</FlexiBoard>
	);
}

export function Dashboard() {
	return (
		<ResponsiveFlexiBoard config={responsiveConfig} lg={board(3)}>
			{board(2)}
		</ResponsiveFlexiBoard>
	);
}
```

</Only>

## Supported breakpoints

You can define breakpoints for these keys:

| Breakpoint | Description |
|------------|-------------|
| `lg` | Large screens |
| `md` | Medium screens |
| `sm` | Small screens |
| `xs` | Extra-small screens |

A default breakpoint (which uses `children`) always implicitly exists, and is used if no breakpoint is matched.

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

## Import and export

When using `ResponsiveFlexiBoard`, use the responsive controller's `importLayout()` and `exportLayout()` methods instead of the inner `FlexiBoard`'s methods:

<Only svelte>

```svelte
<script lang="ts">
	import { ResponsiveFlexiBoard, type ResponsiveFlexiBoardController } from '@flexiboards/svelte';

	let responsiveBoard = $state<ResponsiveFlexiBoardController>();

	function save() {
		const layouts = responsiveBoard?.exportLayout();
		localStorage.setItem('layouts', JSON.stringify(layouts));
	}
</script>

<ResponsiveFlexiBoard bind:controller={responsiveBoard} config={responsiveConfig}>
	<!-- ... -->
</ResponsiveFlexiBoard>
```

</Only>

<Only react>

```tsx
import { ResponsiveFlexiBoard } from '@flexiboards/react';
import type { ResponsiveFlexiBoardController } from '@flexiboards/react';
import { useRef } from 'react';

export function Dashboard() {
	const responsiveBoard = useRef<ResponsiveFlexiBoardController>(null);

	function save() {
		const layouts = responsiveBoard.current?.exportLayout();
		localStorage.setItem('layouts', JSON.stringify(layouts));
	}

	return (
		<ResponsiveFlexiBoard
			config={responsiveConfig}
			onfirstcreate={(controller) => (responsiveBoard.current = controller)}
		>
			{/* ... */}
		</ResponsiveFlexiBoard>
	);
}
```

Components rendered inside the board can also reach the controller with the `useResponsiveFlexiBoard()` hook, without threading a ref through.

</Only>

The responsive controller manages layouts for all breakpoints together.

<Callout variant="warning" title="When using responsive dashboards, use the responsive methods">
When a board is rendering in a responsive context, calling `importLayout()` or `exportLayout()` on the inner `FlexiBoard` will log a warning. Always use the `ResponsiveFlexiBoard` controller's methods instead.
</Callout>

## Auto-persistence

For automatic saving, use `loadLayouts` and `onLayoutsChange`:

<Only svelte>

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

</Only>

<Only react>

```tsx
import { ResponsiveFlexiBoard } from '@flexiboards/react';
import type { ResponsiveFlexiLayout } from '@flexiboards/react';

// Defined outside the component so the board isn't handed a new config object
// on every render.
const responsiveConfig = {
	breakpoints: { lg: 1024 },
	loadLayouts: (): ResponsiveFlexiLayout | undefined => {
		const saved = localStorage.getItem('layouts');
		return saved ? JSON.parse(saved) : undefined;
	},
	onLayoutsChange: (layouts: ResponsiveFlexiLayout) => {
		localStorage.setItem('layouts', JSON.stringify(layouts));
	}
};

export function Dashboard() {
	return (
		<ResponsiveFlexiBoard config={responsiveConfig}>{/* ... */}</ResponsiveFlexiBoard>
	);
}
```

React boards render client-side only, so `loadLayouts` can read `localStorage` directly with no environment guard.

</Only>

As with importing and exporting layouts, prefer these methods over the individual `FlexiBoard`'s methods on a responsive board.

<Callout variant="info" title="Lazy initialisation">
Layouts are created on-demand. If a user never resizes their viewport to trigger a breakpoint, no layout is stored for it. The `onLayoutsChange` callback only includes breakpoints that have been visited.
</Callout>

## Server-side rendering

The server cannot know the viewport, so it guesses a breakpoint. Set `ssrBreakpoint` to the one most visitors land on, and see [Server-Side Rendering](/docs/guides/server-side-rendering#responsive-boards) for handling the mismatch.
