
<script lang="ts">
	import { FlexiBoard, FlexiTarget, simpleTransitionConfig } from 'svelte-flexiboards';
	import type { FlexiBoardConfiguration, FlexiBoardController, FlexiLayout, FlexiWidgetController } from 'svelte-flexiboards';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AppSidebar from '$lib/components/examples/flexiboard/app-sidebar.svelte';
	import DashboardTile from '$lib/components/examples/flexiboard/dashboard-tile.svelte';
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'flexiboards-dashboard-layout';

	const DEFAULT_LAYOUT: FlexiLayout = {
		left: [
			{ type: 'immovable', x: 0, y: 0, width: 1, height: 1, metadata: { type: 'score' } },
			{ type: 'default', x: 1, y: 0, width: 1, height: 1, metadata: { type: 'revenue' } },
			{ type: 'default', x: 2, y: 0, width: 1, height: 1, metadata: { type: 'subscriptions' } },
			{ type: 'default', x: 0, y: 1, width: 3, height: 1, metadata: { type: 'sales' } },
			{ type: 'default', x: 0, y: 2, width: 1, height: 1, metadata: { type: 'active' } }
		]
	};

	let editMode = $state(true);
	let board: FlexiBoardController | undefined = $state();

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
		},
		loadLayout: () => {
			if (!browser) return DEFAULT_LAYOUT;
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				try {
					return JSON.parse(saved) as FlexiLayout;
				} catch {
					return DEFAULT_LAYOUT;
				}
			}
			return DEFAULT_LAYOUT;
		},
		onLayoutChange: (layout) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
			}
		}
	});

	function resetLayout() {
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
		board?.importLayout(DEFAULT_LAYOUT);
	}
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
				<Button variant="outline" size="sm" onclick={resetLayout}>
					Reset Layout
				</Button>
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
			bind:controller={board}
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
			/>
		</FlexiBoard>
	</main>
</Sidebar.Provider>
