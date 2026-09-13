---
title: Dashboard
description: Composable, draggable and resizable tiles with your shadcn theme.
category: Registry
published: true
---

<script lang="ts">
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
 import Only from '$lib/components/docs/only.svelte';
 import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

Use `Dashboard.Root`, `Item`, `Header`, `Content`, `Grabber`, and `Resizer` to compose a dashboard without adopting a whole application layout. The metrics below are ordinary content, not built-in widget types.

## Preview

<Only svelte>

```svelte example
<script lang="ts">
	import * as Dashboard from '$lib/components/flexi-dashboard';
</script>

<Dashboard.Root columns={2} rows={2} maxRows={4} class="w-full">
	<Dashboard.Item x={0} y={0} width={1} height={1}>
		<Dashboard.Header
			><span class="min-w-0 truncate text-sm font-medium">Revenue</span><Dashboard.Grabber
				label="Move revenue"
			/></Dashboard.Header
		>
		<Dashboard.Content
			><p class="text-2xl font-semibold">$24,560</p>
			<p class="text-muted-foreground mt-1 text-sm">This month</p></Dashboard.Content
		>
		<Dashboard.Resizer label="Resize revenue" class="absolute bottom-1 right-1" />
	</Dashboard.Item>
	<Dashboard.Item x={1} y={0} width={1} height={1}>
		<Dashboard.Header
			><span class="min-w-0 truncate text-sm font-medium">Subscribers</span><Dashboard.Grabber
				label="Move subscribers"
			/></Dashboard.Header
		>
		<Dashboard.Content
			><p class="text-2xl font-semibold">1,284</p>
			<p class="text-muted-foreground mt-1 text-sm">Active accounts</p></Dashboard.Content
		>
		<Dashboard.Resizer label="Resize subscribers" class="absolute bottom-1 right-1" />
	</Dashboard.Item>
</Dashboard.Root>
```

</Only>

<Only react>

```tsx example
'use client';
import * as Dashboard from '@/components/flexi-dashboard';

export function DashboardDemo() {
	return (
		<Dashboard.Root columns={2} rows={2} maxRows={4} className="w-full">
			<Dashboard.Item x={0} y={0} width={1} height={1}>
				<Dashboard.Header>
					<span className="min-w-0 truncate text-sm font-medium">Revenue</span>
					<Dashboard.Grabber label="Move revenue" />
				</Dashboard.Header>
				<Dashboard.Content>
					<p className="text-2xl font-semibold">$24,560</p>
					<p className="text-muted-foreground mt-1 text-sm">This month</p>
				</Dashboard.Content>
				<Dashboard.Resizer label="Resize revenue" className="absolute bottom-1 right-1" />
			</Dashboard.Item>
			<Dashboard.Item x={1} y={0} width={1} height={1}>
				<Dashboard.Header>
					<span className="min-w-0 truncate text-sm font-medium">Subscribers</span>
					<Dashboard.Grabber label="Move subscribers" />
				</Dashboard.Header>
				<Dashboard.Content>
					<p className="text-2xl font-semibold">1,284</p>
					<p className="text-muted-foreground mt-1 text-sm">Active accounts</p>
				</Dashboard.Content>
				<Dashboard.Resizer label="Resize subscribers" className="absolute bottom-1 right-1" />
			</Dashboard.Item>
		</Dashboard.Root>
	);
}
```

</Only>

## Installation

Start with a Tailwind project configured for shadcn and its theme variables. This copies editable source into your components directory; it does not install a second theme.

<Only svelte>

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-dashboard.json" />

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-dashboard.json" />

</Only>

## Anatomy

`Root` owns one free-form target. Declare `Item` components inside it; put headers, content, and handles inside each item. You can omit either presentation wrapper or replace its contents with your own components.

## API

| Part                  | Props and defaults                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Root`                | All [FlexiDashboard props](/docs/presets#dashboard-grid). Resizing is enabled by default, with 4 columns, 3 rows, 160px row tracks, and `gap-4`. |
| `Item`                | All [FlexiWidget props](/docs/components/widget), including coordinates, dimensions, metadata, configuration, and controller access.             |
| `Header`              | Ordinary div attributes and children. Aligns a title and actions.                                                                                |
| `Content`             | Ordinary div attributes and children. Fills remaining space and scrolls overflow.                                                                |
| `Grabber` / `Resizer` | [Grabber](/docs/registry/grabber) and [Resizer](/docs/registry/resizer) props.                                                                   |

Use <FrameworkText svelte="class" react="className" code /> to override styles. Item classes also accept a function of the widget controller. Consumer classes are merged last, including when customizing shadow and grabbed states.

## Sizing and responsiveness

Set `columns`, `rows`, and `maxRows` explicitly for your content. Override row tracks with `targetConfig={{ rowSizing: '200px' }}`. Place a resize handle in each resizable tile; pass `resizable={false}` to disable resizing for the dashboard.

The default grid is fixed-column, not an automatic breakpoint layout. For different saved layouts at different screen sizes, compose the headless [ResponsiveFlexiBoard](/docs/components/responsive-board) with targets and these themed items.

## Saving layouts

Pass `config.onLayoutChange` to receive the exported layout, and use the existing [import/export APIs](/docs/guides/exporting-importing-boards). This installable source registry is separate from `config.registry`, which maps persisted widget types to rendered content.

<Only react>

In Next.js, compose these components inside a client component.

</Only>

The underlying [SSR and hydration support](/docs/guides/server-side-rendering) is unchanged.

## Motion

Movement uses short CSS transitions by default and respects reduced motion. [Compare presets or disable transitions](/docs/registry/motion).
