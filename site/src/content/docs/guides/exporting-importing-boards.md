---
title: Exporting & Importing Layouts
description: Learn how to save and restore widget layouts for persistence.
category: Guides
published: true
---

<script lang="ts">
	import Callout from '$lib/components/docs/callout.svelte';
	import Only from '$lib/components/docs/only.svelte';
</script>

A board's layout, the position, size, type, and metadata of every widget, can be exported as plain JSON and imported again later. Give each widget a `type`, register that type on the board, and the controller's `exportLayout()` and `importLayout()` do the rest:

<Only svelte>

```svelte example title="Save and restore"
<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiBoardController,
		type FlexiLayout
	} from '@flexiboards/svelte';

	let board = $state<FlexiBoardController>();
	let saved = $state<FlexiLayout>();
</script>

{#snippet label({ widget })}
	{widget.metadata?.label}
{/snippet}

<div class="flex w-72 gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
	<button
		class="rounded-md border px-3 py-1 text-sm"
		onclick={() => (saved = board?.exportLayout())}
	>
		Save
	</button>
	<button
		class="rounded-md border px-3 py-1 text-sm"
		disabled={!saved}
		onclick={() => saved && board?.importLayout(saved)}
	>
		Restore
	</button>
</div>

<FlexiBoard
	bind:controller={board}
	class="size-72 rounded-b-xl border p-8 lg:size-96"
	config={{
		registry: {
			tile: {
				snippet: label,
				className: 'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
				draggability: 'full'
			}
		}
	}}
>
	<FlexiTarget
		key="main"
		class="h-full w-full gap-4"
		containerClass="h-full w-full"
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: { type: 'free', minRows: 2, minColumns: 2, maxRows: 2, maxColumns: 2 }
		}}
	>
		<FlexiWidget type="tile" x={0} y={0} metadata={{ label: 'A' }} />
		<FlexiWidget type="tile" x={1} y={1} metadata={{ label: 'B' }} />
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="Save and restore"
import { FlexiBoard, FlexiTarget, FlexiWidget, useFlexiWidget } from '@flexiboards/react';
import type { FlexiBoardController, FlexiLayout } from '@flexiboards/react';
import { useRef, useState } from 'react';

function Label() {
	const widget = useFlexiWidget();
	return <>{String(widget.metadata?.label ?? '')}</>;
}

const boardConfig = {
	registry: {
		tile: {
			component: Label,
			className: 'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
			draggability: 'full'
		}
	}
} as const;

export function SaveAndRestore() {
	const board = useRef<FlexiBoardController>(null);
	const [saved, setSaved] = useState<FlexiLayout>();

	return (
		<>
			<div className="flex w-72 gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
				<button
					className="rounded-md border px-3 py-1 text-sm"
					onClick={() => setSaved(board.current?.exportLayout())}
				>
					Save
				</button>
				<button
					className="rounded-md border px-3 py-1 text-sm"
					disabled={!saved}
					onClick={() => saved && board.current?.importLayout(saved)}
				>
					Restore
				</button>
			</div>

			<FlexiBoard
				onfirstcreate={(controller) => (board.current = controller)}
				className="size-72 rounded-b-xl border p-8 lg:size-96"
				config={boardConfig}
			>
				<FlexiTarget
					keyName="main"
					className="h-full w-full gap-4"
					containerClassName="h-full w-full"
					config={{
						rowSizing: 'minmax(0, 1fr)',
						layout: { type: 'free', minRows: 2, minColumns: 2, maxRows: 2, maxColumns: 2 }
					}}
				>
					<FlexiWidget type="tile" x={0} y={0} metadata={{ label: 'A' }} />
					<FlexiWidget type="tile" x={1} y={1} metadata={{ label: 'B' }} />
				</FlexiTarget>
			</FlexiBoard>
		</>
	);
}
```

</Only>

Save, move the widgets around, then Restore. Each widget's content comes from its registry entry and its label from `metadata`, both of which survive the round trip. The rest of this guide builds on that: persisting to storage, loading on mount, server-provided layouts, and auto-saving.

## The registry

Before you can use import/export, you need to set up a **registry**. The registry maps widget types to their rendering configuration (component, styling, behavior, etc.).

When exporting, Flexiboards saves only the widget's `type` (a string key) rather than the full component reference. When importing, it uses the registry to look up how to render each widget.

A widget declared without a `type` is still exported, with its position and `metadata`, so nothing you have is lost. It is skipped on import, since the registry has nothing to render it with, and a warning says so.

Every exported entry carries an `id`: the one you gave the widget, or a generated one. It round-trips through import, so you can match stored entries to your own records without inventing an identifier in `metadata`.

## Versioning what you store

`exportLayout()` returns the bare layout, which is what most code passes around. For storage, prefer `exportLayoutEnvelope()`, which wraps it as `{ version, layout }` with the current `LAYOUT_FORMAT_VERSION`. `importLayout()` and `loadLayout` accept either shape. Today there is one version, so the envelope costs nothing; when the format changes, the version is what lets a later release migrate what you stored instead of misreading it.

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/svelte';
	import ChartWidget from './chart-widget.svelte';
	import TableWidget from './table-widget.svelte';

	const boardConfig: FlexiBoardConfiguration = {
		registry: {
			chart: {
				component: ChartWidget,
				resizability: 'both'
			},
			table: {
				component: TableWidget,
				resizability: 'horizontal'
			}
		}
	};
</script>

<FlexiBoard config={boardConfig}>
	<!-- ... -->
</FlexiBoard>
```

</Only>

<Only react>

```tsx
import { FlexiBoard } from '@flexiboards/react';
import type { FlexiBoardConfiguration } from '@flexiboards/react';
import { ChartWidget } from './chart-widget';
import { TableWidget } from './table-widget';

// Defined outside the component so the board isn't handed a new config object
// on every render. If the config depends on state, wrap it in useMemo instead.
const boardConfig: FlexiBoardConfiguration = {
	registry: {
		chart: {
			component: ChartWidget,
			resizability: 'both'
		},
		table: {
			component: TableWidget,
			resizability: 'horizontal'
		}
	}
};

export function Dashboard() {
	return <FlexiBoard config={boardConfig}>{/* ... */}</FlexiBoard>;
}
```

</Only>

Each registry entry can include any widget configuration options like `component`, `className`, `resizability`, `draggability`, `minWidth`, `maxWidth`, etc. (plus `snippet` in Svelte, which holds the widget's rendered content). These are applied as defaults when a widget of that type is created.

## Creating widgets with types

To make a widget exportable, assign it a `type` that matches a key in your registry:

```jsx
<FlexiWidget type="chart" x={0} y={0} width={2} height={2} />
<FlexiWidget type="table" x={2} y={0} width={1} height={1} />
```

When exporting, widgets without a `type` will be skipped (with a console warning).

## Exporting layouts

Use the `exportLayout()` method on the board controller to get the current layout:

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from '@flexiboards/svelte';

	let board = $state<FlexiBoardController>();

	function saveLayout() {
		if (!board) return;
		const layout = board.exportLayout();

		// Save to localStorage
		localStorage.setItem('dashboard-layout', JSON.stringify(layout));

		// Or send to your backend
		// await fetch('/api/layouts', { method: 'POST', body: JSON.stringify(layout) });
	}
</script>

<FlexiBoard bind:controller={board} config={boardConfig}>
	<!-- ... -->
</FlexiBoard>

<button onclick={saveLayout}>Save Layout</button>
```

</Only>

<Only react>

There is no two-way binding in React; take the controller from `onfirstcreate` and hold it in a ref:

```tsx
import { FlexiBoard } from '@flexiboards/react';
import type { FlexiBoardController } from '@flexiboards/react';
import { useRef } from 'react';

export function Dashboard() {
	const board = useRef<FlexiBoardController>(null);

	function saveLayout() {
		const layout = board.current?.exportLayout();

		// Save to localStorage
		localStorage.setItem('dashboard-layout', JSON.stringify(layout));

		// Or send to your backend
		// await fetch('/api/layouts', { method: 'POST', body: JSON.stringify(layout) });
	}

	return (
		<>
			<FlexiBoard onfirstcreate={(controller) => (board.current = controller)} config={boardConfig}>
				{/* ... */}
			</FlexiBoard>

			<button onClick={saveLayout}>Save Layout</button>
		</>
	);
}
```

A component rendered _inside_ the board can skip the ref entirely and call `useFlexiBoard()` to get the same controller.

</Only>

<Callout variant="warning" title="Validate, if necessary">
Like all client-side data, exported layouts could be tampered with. If the data stored on a layout is critical to function, always validate and sanitise layouts on your server before trusting `metadata` or other fields.
</Callout>

The exported layout is a `FlexiLayout` object, which maps target keys to arrays of widget entries:

```typescript
// FlexiLayout structure
{
	"target-0": [
		{
			type: "chart",
			x: 0,
			y: 0,
			width: 2,
			height: 2,
			metadata: { dataSource: "sales" }
		},
		{
			type: "table",
			x: 2,
			y: 0,
			width: 1,
			height: 1
		}
	]
}
```

## Importing layouts

Use the `importLayout()` method to restore a saved layout:

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController, type FlexiLayout } from '@flexiboards/svelte';

	let board = $state<FlexiBoardController>();

	function loadLayout() {
		const saved = localStorage.getItem('dashboard-layout');
		if (saved) {
			const layout: FlexiLayout = JSON.parse(saved);
			board?.importLayout(layout);
		}
	}
</script>

<FlexiBoard bind:controller={board} config={boardConfig}>
	<FlexiTarget key="main">
		<!-- Widgets will be created from the imported layout -->
	</FlexiTarget>
</FlexiBoard>

<button onclick={loadLayout}>Load Layout</button>
```

</Only>

<Only react>

```tsx
import { FlexiBoard, FlexiTarget } from '@flexiboards/react';
import type { FlexiBoardController, FlexiLayout } from '@flexiboards/react';
import { useRef } from 'react';

export function Dashboard() {
	const board = useRef<FlexiBoardController>(null);

	function loadLayout() {
		const saved = localStorage.getItem('dashboard-layout');
		if (saved) {
			const layout: FlexiLayout = JSON.parse(saved);
			board.current?.importLayout(layout);
		}
	}

	return (
		<>
			<FlexiBoard onfirstcreate={(controller) => (board.current = controller)} config={boardConfig}>
				<FlexiTarget keyName="main">
					{/* Widgets will be created from the imported layout */}
				</FlexiTarget>
			</FlexiBoard>

			<button onClick={loadLayout}>Load Layout</button>
		</>
	);
}
```

</Only>

<Callout variant="info" title="Important">
When importing, any existing widgets in the target are cleared and replaced with the imported widgets.
</Callout>

## Loading on mount

For the common case of loading a layout when the board first renders, use the `loadLayout` config option:

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration, type FlexiLayout } from '@flexiboards/svelte';

	const boardConfig: FlexiBoardConfiguration = {
		registry: {
			// ... your registry
		},
		loadLayout: () => {
			const saved = localStorage.getItem('dashboard-layout');
			if (saved) {
				return JSON.parse(saved) as FlexiLayout;
			}
			return undefined;
		}
	};
</script>

<FlexiBoard config={boardConfig}>
	<FlexiTarget key="main">
		<!-- Widgets loaded automatically -->
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx
import { FlexiBoard, FlexiTarget } from '@flexiboards/react';
import type { FlexiBoardConfiguration, FlexiLayout } from '@flexiboards/react';

const boardConfig: FlexiBoardConfiguration = {
	registry: {
		// ... your registry
	},
	loadLayout: () => {
		const saved = localStorage.getItem('dashboard-layout');
		if (saved) {
			return JSON.parse(saved) as FlexiLayout;
		}
		return undefined;
	}
};

export function Dashboard() {
	return (
		<FlexiBoard config={boardConfig}>
			<FlexiTarget keyName="main">{/* Widgets loaded automatically */}</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

The `loadLayout` function is called once after the board is ready, and supports returning either:

- A full `FlexiLayout` object (for multi-target boards)
- An array of `FlexiWidgetLayoutEntry[]` (shorthand for single-target boards)

<Callout variant="info" title="loadLayout is client-only">
	Because it typically reads client storage, <code>loadLayout</code> is never invoked during server-side rendering. The server renders the declared layout as a stand-in, and the callback runs at hydration. For layouts the server already has, use <code>initialLayout</code> below.
</Callout>

## Initial layouts for server-rendered pages

When you already _have_ the layout at render time, say a saved board fetched on the server and handed to the page, use `initialLayout` instead of `loadLayout`. It takes a plain `FlexiLayout` value rather than a callback, and is applied during the very first render pass.

<Only svelte>

```ts
// +page.server.ts
export async function load({ locals }) {
	return { layout: await getBoardLayout(locals.user) };
}
```

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/svelte';

	let { data } = $props();

	const boardConfig: FlexiBoardConfiguration = {
		registry: {
			// ... your registry
		},
		initialLayout: data.layout
	};
</script>

<FlexiBoard config={boardConfig}>
	<FlexiTarget key="main">
		<!-- Widgets from the layout render here, server-side included.
		     Any declared widgets act as a fallback for targets the
		     layout has no entry for. -->
	</FlexiTarget>
</FlexiBoard>
```

The board server-renders at the layout's final positions, and because SvelteKit hands the same data to the client, hydration matches exactly. There is no loading flash and no layout shift. Entries resolve through the registry via their `type`, the same as `importLayout()`.

On a `ResponsiveFlexiBoard`, use `initialLayouts` (keyed by breakpoint, like `loadLayouts`). If both `initialLayout` and `loadLayout` are configured, the initial layout renders first and `loadLayout` overrides it on the client. That suits a local draft that should beat the server copy. See the [Server-Side Rendering guide](/docs/guides/server-side-rendering) for the full SSR picture.

</Only>

<Only react>

```tsx
import { FlexiBoard, FlexiTarget } from '@flexiboards/react';
import type { FlexiBoardConfiguration, FlexiLayout } from '@flexiboards/react';
import { useMemo } from 'react';

export function Dashboard({ layout }: { layout: FlexiLayout }) {
	const boardConfig = useMemo<FlexiBoardConfiguration>(
		() => ({
			registry: {
				// ... your registry
			},
			initialLayout: layout
		}),
		[layout]
	);

	return (
		<FlexiBoard config={boardConfig}>
			<FlexiTarget keyName="main">
				{/* Widgets from the layout render here. Any declared widgets act
				    as a fallback for targets the layout has no entry for. */}
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

The board's first paint is already at the layout's final positions, so there is no loading flash and no layout shift. Entries resolve through the registry via their `type`, the same as `importLayout()`.

On a `ResponsiveFlexiBoard`, use `initialLayouts` (keyed by breakpoint, like `loadLayouts`). If both `initialLayout` and `loadLayout` are configured, the initial layout is applied first and `loadLayout` overrides it. That suits a local draft that should beat the server copy.

React Flexiboards mount client-side, so `initialLayout` buys you a correct _first_ client render rather than server-rendered markup. The [Server-Side Rendering guide](/docs/guides/server-side-rendering) explains why.

</Only>

## Auto-saving with onLayoutChange

For automatic persistence whenever the layout changes, use the `onLayoutChange` callback:

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from '@flexiboards/svelte';
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'my-dashboard-layout';

	const boardConfig: FlexiBoardConfiguration = {
		registry: {
			// ... your registry
		},
		loadLayout: () => {
			if (!browser) return undefined;
			const saved = localStorage.getItem(STORAGE_KEY);
			return saved ? JSON.parse(saved) : undefined;
		},
		onLayoutChange: (layout) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
			}
		}
	};
</script>

<FlexiBoard config={boardConfig}>
	<!-- ... -->
</FlexiBoard>
```

</Only>

<Only react>

```tsx
import { FlexiBoard } from '@flexiboards/react';
import type { FlexiBoardConfiguration, FlexiLayout } from '@flexiboards/react';

const STORAGE_KEY = 'my-dashboard-layout';

const boardConfig: FlexiBoardConfiguration = {
	registry: {
		// ... your registry
	},
	loadLayout: () => {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) : undefined;
	},
	onLayoutChange: (layout: FlexiLayout) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
	}
};

export function Dashboard() {
	return <FlexiBoard config={boardConfig}>{/* ... */}</FlexiBoard>;
}
```

Because React boards only ever mount in the browser, neither callback needs an environment guard.

</Only>

The `onLayoutChange` callback fires (debounced) whenever:

- A widget is moved to a new position
- A widget is resized
- A widget is deleted

Your stored layout stays in sync without a manual save button.

## Widget IDs

For more advanced scenarios, you can assign stable IDs to widgets:

```jsx
<FlexiWidget id="main-chart" type="chart" x={0} y={0} />
```

The `id` is preserved through export/import. Use it to:

- Track specific widget instances across sessions
- Implement features like "reset widget to default position"
- Reference widgets in your application logic

IDs are optional. When not provided, widgets are identified only by their position and type.

## Working with metadata

Widget metadata is preserved through export/import, so it is a good place for widget-specific configuration:

```jsx
<FlexiWidget
	type="chart"
	metadata={{
		dataSource: 'sales',
		chartType: 'line',
		dateRange: 'last-30-days'
	}}
/>
```

Access metadata in your widget component:

<Only svelte>

```svelte
<!-- chart-widget.svelte -->
<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';

	const widget = getFlexiwidgetCtx();

	// Access the metadata
	const dataSource = $derived(widget.metadata?.dataSource);
</script>
```

</Only>

<Only react>

```tsx
// chart-widget.tsx
import { useFlexiWidget } from '@flexiboards/react';

export function ChartWidget() {
	const widget = useFlexiWidget();

	// Access the metadata. The hook returns a reactive proxy, so reading
	// metadata here re-renders this component whenever it changes.
	const dataSource = widget.metadata?.dataSource;

	return <div>{String(dataSource)}</div>;
}
```

</Only>

## Reference

The layout, entry, and registry types are listed on the [FlexiBoard page](/docs/components/board#flexilayout).
