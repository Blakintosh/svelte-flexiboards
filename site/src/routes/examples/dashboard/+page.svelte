
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget, simpleTransitionConfig } from 'svelte-flexiboards';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import AppSidebar from '$lib/components/examples/flexiboard/app-sidebar.svelte';
	import type { FlexiBoardConfiguration, FlexiBoardController, FlexiWidgetController } from 'svelte-flexiboards';
	import DashboardTile from '$lib/components/examples/flexiboard/dashboard-tile.svelte';
	

	let editMode = $state(true);

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggability: 'full',
			resizability: 'horizontal'
		},
		registry: {
			default: {
				component: DashboardTile,
				className: (widget: FlexiWidgetController) => [
					widget.isGrabbed && 'animate-pulse opacity-50',
					widget.isShadow && 'opacity-50'
				]
			},
			immovable: {
				component: DashboardTile,
				draggability: 'none',
				resizability: 'none'
			}
		}
	});

	let onBoardReady = (board: FlexiBoardController) => {};
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<Sidebar.Provider class="h-full min-h-0 grow">
	<AppSidebar />
	<main class="flex min-h-0 w-full grow flex-col gap-8 px-4 py-8 lg:px-16">
		<h1 class="flex shrink-0 justify-between text-3xl font-semibold">
			Dashboard
			<div class="flex items-center gap-2">
				<Switch
					id="edit-mode"
					bind:checked={editMode}
					onCheckedChange={() => {
						boardConfig.widgetDefaults = {
							draggability: editMode ? 'full' : 'none',
							resizability: editMode ? 'horizontal' : 'none'
						};
					}}
				/>
				<Label for="edit-mode">Edit mode</Label>
			</div>
		</h1>

		<FlexiBoard
			class={'min-h-0 grow overflow-x-clip overflow-y-auto'}
			config={boardConfig}
			onfirstcreate={onBoardReady}
		>
			<FlexiTarget
				key="left"
				class={'h-full gap-2 overflow-x-clip lg:gap-4'}
				config={{
					rowSizing: 'minmax(0, 180px)',
					layout: {
						type: 'free',
						minColumns: 3,
						maxColumns: 3,
						minRows: 3,
						maxRows: 4,
						colllapsibility: 'any',
						packing: 'vertical'
					},
					widgetDefaults: {
						transition: simpleTransitionConfig()
					}
				}}
			>
				<FlexiWidget
					registryKey="immovable"
					metadata={{ type: "score" }}
					x={0}
					y={0}
				/>
				<FlexiWidget
					registryKey="default"
					metadata={{ type: "revenue" }}
					x={1}
					y={0}
				/>
				<FlexiWidget
					registryKey="default"
					metadata={{ type: "subscriptions" }}
					x={2}
					y={0}
				/>
				<FlexiWidget
					registryKey="default"
					metadata={{ type: "sales" }}
					x={0}
					y={1}
					width={3}
				/>
				<FlexiWidget
					registryKey="default"
					metadata={{ type: "active" }}
					x={0}
					y={1}
				/>
			</FlexiTarget>
		</FlexiBoard>
	</main>
</Sidebar.Provider>
