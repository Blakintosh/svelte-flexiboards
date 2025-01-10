<script module lang="ts">
	type DashboardRegistryItem = {
		component: Component;
		componentProps: Record<string, unknown>;
	};

	const dashboardRegistry: Record<string, DashboardRegistryItem> = {
		overallScore: {
			component: DashboardTile,
			componentProps: {
				title: 'Overall Score',
				content: '87',
				trend: '+8 from last month'
			}
		}
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

	let onBoardReady = (board: FlexiBoardController) => {
		//console.log('The board has landed!', board);
		// board.importLayout();
		// board.exportLayout();
	};
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<main class="flex h-full min-h-0 w-full flex-col gap-8 px-16 py-8">
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

		<FlexiBoard class={'grow'} config={boardConfig} onfirstcreate={onBoardReady}>
			<FlexiTarget
				name="left"
				class={'h-full gap-4'}
				config={{
					minRows: 4,
					minColumns: 3,
					layout: {
						type: 'free',
						expandColumns: false,
						expandRows: true
					}
				}}
			>
				<DashboardTile title="Overall Score" x={0} y={0} draggable={false} resizability={'none'}>
					<div class="text-2xl font-bold">87</div>
					<p class="text-xs text-muted-foreground">+8 from last month</p>
				</DashboardTile>
				<DashboardTile title="Total Revenue" x={1} y={0}>
					<div class="text-2xl font-bold">$45,231.89</div>
					<p class="text-xs text-muted-foreground">+20.1% from last month</p>
				</DashboardTile>
				<DashboardTile title="Subscriptions" x={2} y={0}>
					<div class="text-2xl font-bold">+2350</div>
					<p class="text-xs text-muted-foreground">-30.4% from last month</p>
				</DashboardTile>
				<DashboardTile title="Sales" x={0} y={1} width={3}>
					<div class="text-2xl font-bold">+12,234</div>
					<p class="text-xs text-muted-foreground">+19.1% from last month</p>
				</DashboardTile>
				<DashboardTile title="Active Now" x={0} y={2}>
					<div class="text-2xl font-bold">+573</div>
					<p class="text-xs text-muted-foreground">+201 since last hour</p>
				</DashboardTile>
			</FlexiTarget>
		</FlexiBoard>
	</main>
</Sidebar.Provider>
