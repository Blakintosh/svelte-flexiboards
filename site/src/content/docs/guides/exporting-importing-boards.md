---
title: Exporting & Importing Layouts
description: Learn how to save and restore widget layouts for persistence.
category: Guides
published: true
---

<script>
	import Callout from '$lib/components/docs/callout.svelte';
</script>

## Introduction

Flexiboards provides a simple API for exporting and importing widget layouts. This enables you to:

- Save user layouts to a database or local storage
- Restore layouts when a user returns to your application
- Share layouts between users
- Implement undo/redo functionality

The layout system captures the position, size, type, and metadata of each widget, allowing you to fully reconstruct a board's state.

## The Registry

Before you can use import/export, you need to set up a **registry**. The registry maps widget types to their rendering configuration (component, styling, behavior, etc.).

When exporting, Flexiboards saves only the widget's `type` (a string key) rather than the full component reference. When importing, it uses the registry to look up how to render each widget.

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from 'svelte-flexiboards';
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

Each registry entry can include any widget configuration options like `component`, `snippet`, `className`, `resizability`, `draggability`, `minWidth`, `maxWidth`, etc. These are applied as defaults when a widget of that type is created.

## Creating Widgets with Types

To make a widget exportable, assign it a `type` that matches a key in your registry:

```svelte
<FlexiWidget type="chart" x={0} y={0} width={2} height={2} />
<FlexiWidget type="table" x={2} y={0} width={1} height={1} />
```

When exporting, widgets without a `type` will be skipped (with a console warning).

## Exporting Layouts

Use the `exportLayout()` method on the board controller to get the current layout:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from 'svelte-flexiboards';

	let board: FlexiBoardController;

	function saveLayout() {
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

## Importing Layouts

Use the `importLayout()` method to restore a saved layout:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController, type FlexiLayout } from 'svelte-flexiboards';

	let board: FlexiBoardController;

	function loadLayout() {
		const saved = localStorage.getItem('dashboard-layout');
		if (saved) {
			const layout: FlexiLayout = JSON.parse(saved);
			board.importLayout(layout);
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

<Callout variant="info" title="Important">
When importing, any existing widgets in the target are cleared and replaced with the imported widgets.
</Callout>

## Loading on Mount

For the common case of loading a layout when the board first renders, use the `loadLayout` config option:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration, type FlexiLayout } from 'svelte-flexiboards';

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

The `loadLayout` function is called once after the board is ready, and supports returning either:
- A full `FlexiLayout` object (for multi-target boards)
- An array of `FlexiWidgetLayoutEntry[]` (shorthand for single-target boards)

## Auto-Saving with onLayoutChange

For automatic persistence whenever the layout changes, use the `onLayoutChange` callback:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardConfiguration } from 'svelte-flexiboards';
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

The `onLayoutChange` callback fires (debounced) whenever:
- A widget is moved to a new position
- A widget is resized
- A widget is deleted

This makes it easy to keep your stored layout in sync without manual save buttons.

## Widget IDs

For more advanced scenarios, you can assign stable IDs to widgets:

```svelte
<FlexiWidget id="main-chart" type="chart" x={0} y={0} />
```

The `id` is preserved through export/import, allowing you to:
- Track specific widget instances across sessions
- Implement features like "reset widget to default position"
- Reference widgets in your application logic

IDs are optional. When not provided, widgets are identified only by their position and type.

## Working with Metadata

Widget metadata is preserved through export/import, making it useful for storing widget-specific configuration:

```svelte
<FlexiWidget
	type="chart"
	metadata={{
		dataSource: "sales",
		chartType: "line",
		dateRange: "last-30-days"
	}}
/>
```

Access metadata in your widget component:

```svelte
<!-- chart-widget.svelte -->
<script lang="ts">
	import { getFlexiwidgetCtx } from 'svelte-flexiboards';

	const widget = getFlexiwidgetCtx();

	// Access the metadata
	const dataSource = $derived(widget.metadata?.dataSource);
</script>
```

## Type Reference

```typescript
// The full layout structure
type FlexiLayout = Record<string, FlexiWidgetLayoutEntry[]>;

// Individual widget entry
type FlexiWidgetLayoutEntry = {
	id?: string;           // Optional stable identifier
	type: string;          // Registry key (required)
	x: number;             // Column position
	y: number;             // Row position
	width: number;         // Width in grid units
	height: number;        // Height in grid units
	metadata?: Record<string, any>;  // Custom data
};

// Registry entry (widget type configuration)
type FlexiRegistryEntry = {
	component?: Component;
	snippet?: FlexiWidgetChildrenSnippet;
	className?: FlexiWidgetClasses;
	componentProps?: Record<string, any>;
	draggability?: WidgetDraggability;
	resizability?: WidgetResizability;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	// ... other widget defaults
};

// Load layout function signature
type FlexiLoadLayoutFn = () => FlexiLayout | FlexiWidgetLayoutEntry[] | undefined;

// Layout change callback signature
type FlexiLayoutChangeFn = (layout: FlexiLayout) => void;
```
