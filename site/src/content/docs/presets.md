---
title: Presets
description: Start with a sortable list or a dashboard grid in three lines, then graduate to the full components when you need more.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
	import ApiProps from '$lib/components/docs/api-props.svelte';
	import sortableApi from '$lib/generated/api/flexi-sortable.json';
	import dashboardApi from '$lib/generated/api/flexi-dashboard.json';
</script>

Two presets cover the boards people most often ask for. Each is one `FlexiBoard` wrapped around one `FlexiTarget` with the layout already chosen, so the first board you write has nothing to configure. Everything a board or target accepts still reaches them through `config` and `targetConfig`.

## Sortable list

<Only svelte>

```svelte example title="Sortable list"
<script lang="ts">
	import { FlexiSortable, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiSortable class="w-72 gap-2">
	<FlexiWidget class="bg-card rounded-lg border px-4 py-2">Write the docs</FlexiWidget>
	<FlexiWidget class="bg-card rounded-lg border px-4 py-2">Record the demo</FlexiWidget>
	<FlexiWidget class="bg-card rounded-lg border px-4 py-2">Ship it</FlexiWidget>
</FlexiSortable>
```

</Only>

<Only react>

```tsx example title="Sortable list"
import { FlexiSortable, FlexiWidget } from '@flexiboards/react';

export function SortableList() {
	return (
		<FlexiSortable className="w-72 gap-2">
			<FlexiWidget className="bg-card rounded-lg border px-4 py-2">Write the docs</FlexiWidget>
			<FlexiWidget className="bg-card rounded-lg border px-4 py-2">Record the demo</FlexiWidget>
			<FlexiWidget className="bg-card rounded-lg border px-4 py-2">Ship it</FlexiWidget>
		</FlexiSortable>
	);
}
```

</Only>

`FlexiSortable` is a flow grid with one column (`direction="vertical"`, the default) or one row (`direction="horizontal"`). Items pack together and keep their order; drag one onto another and they swap. Widgets are fully draggable unless `config.widgetDefaults` says otherwise.

<ApiProps api={sortableApi} />

## Dashboard grid

<Only svelte>

```svelte example title="Dashboard grid"
<script lang="ts">
	import { FlexiDashboard, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiDashboard columns={3} rows={2} class="w-96 gap-2">
	<FlexiWidget x={0} y={0} width={2} height={1} class="bg-card rounded-lg border p-3"
		>Revenue</FlexiWidget
	>
	<FlexiWidget x={2} y={0} width={1} height={1} class="bg-card rounded-lg border p-3"
		>Users</FlexiWidget
	>
	<FlexiWidget x={0} y={1} width={1} height={1} class="bg-card rounded-lg border p-3"
		>Churn</FlexiWidget
	>
</FlexiDashboard>
```

</Only>

<Only react>

```tsx example title="Dashboard grid"
import { FlexiDashboard, FlexiWidget } from '@flexiboards/react';

export function Dashboard() {
	return (
		<FlexiDashboard columns={3} rows={2} className="w-96 gap-2">
			<FlexiWidget x={0} y={0} width={2} height={1} className="bg-card rounded-lg border p-3">
				Revenue
			</FlexiWidget>
			<FlexiWidget x={2} y={0} width={1} height={1} className="bg-card rounded-lg border p-3">
				Users
			</FlexiWidget>
			<FlexiWidget x={0} y={1} width={1} height={1} className="bg-card rounded-lg border p-3">
				Churn
			</FlexiWidget>
		</FlexiDashboard>
	);
}
```

</Only>

`FlexiDashboard` is a free-form grid: widgets sit at coordinates and may leave gaps. `columns` fixes the width, `rows` the starting height, and `maxRows` how far the grid may grow when a widget is pushed down. Pass `resizable` to let widgets be resized from a `FlexiResize` handle.

<ApiProps api={dashboardApi} />

## When to move on

A preset is a board with one target, so it stops fitting the moment you want two lists that trade items, a header above the grid, or a target that is not the whole board. The move is mechanical: the preset's `config` becomes the `FlexiBoard` config, `targetConfig` plus the layout from the table above becomes the `FlexiTarget` config, and the children stay as they are. See [Flow Grids](/docs/flow-grids), [Free-Form Grids](/docs/free-form-grids) and [Multiple Targets](/docs/multiple-targets).
