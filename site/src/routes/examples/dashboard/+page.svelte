<script module lang="ts">
	type DashboardRegistryItem = {
		component: Component;
		componentProps: Record<string, unknown>;
	};
</script>

<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import AppSidebar from '$lib/components/examples/flexiboard/app-sidebar.svelte';
	import type { FlexiBoardConfiguration, FlexiBoardController } from 'svelte-flexiboards';
	import DashboardTile from '$lib/components/examples/flexiboard/dashboard-tile.svelte';
	import type { Component } from 'svelte';

	let editMode = $state(true);

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true,
			resizability: 'horizontal'
		}
	});

	let onBoardReady = (board: FlexiBoardController) => {};
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<Sidebar.Provider class="grow min-h-0 h-full">
	<AppSidebar />
	<main class="flex grow min-h-0 w-full flex-col gap-8 px-4 py-8 lg:px-16">
		<h1 class="flex shrink-0 justify-between text-3xl font-semibold">
			Dashboard
			<div class="flex items-center gap-2">
				<Switch
					id="edit-mode"
					bind:checked={editMode}
					onCheckedChange={() => {
						boardConfig.widgetDefaults = {
							draggable: editMode,
							resizability: editMode ? 'horizontal' : 'none'
						};
					}}
				/>
				<Label for="edit-mode">Edit mode</Label>
			</div>
		</h1>

		<FlexiBoard class={'grow min-h-0 overflow-y-auto'} config={boardConfig} onfirstcreate={onBoardReady}>
			<FlexiTarget
				key="left"
				class={'h-full gap-2 lg:gap-4'}
				config={{
					rowSizing: 'minmax(0, 1fr)',
					layout: {
						type: 'free',
						minColumns: 3,
						maxColumns: 3,
						minRows: 2,
						maxRows: 4,
						colllapsibility: 'any'
					}
				}}
			>
				<DashboardTile title="Overall Score" x={0} y={0} draggable={false} resizability={'none'}>
					<div class="text-lg font-bold lg:text-2xl">87</div>
					<p class="text-xs text-muted-foreground">+8 from last month</p>
				</DashboardTile>
				<DashboardTile title="Total Revenue" x={1} y={0}>
					<div class="text-lg font-bold lg:text-2xl">$45,231.89</div>
					<p class="text-xs text-muted-foreground">+20.1% from last month</p>
				</DashboardTile>
				<DashboardTile title="Subscriptions" x={2} y={0}>
					<div class="text-lg font-bold lg:text-2xl">+2350</div>
					<p class="text-xs text-muted-foreground">-30.4% from last month</p>
				</DashboardTile>
				<DashboardTile title="Sales" x={0} y={1} width={3}>
					<div class="text-lg font-bold lg:text-2xl">+12,234</div>
					<p class="text-xs text-muted-foreground">+19.1% from last month</p>
				</DashboardTile>
				<DashboardTile title="Active Now" x={0} y={2}>
					<div class="text-lg font-bold lg:text-2xl">+573</div>
					<p class="text-xs text-muted-foreground">+201 since last hour</p>
				</DashboardTile>
			</FlexiTarget>
		</FlexiBoard>
	</main>
</Sidebar.Provider>
