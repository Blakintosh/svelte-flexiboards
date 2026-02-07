<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		ResponsiveFlexiBoard,
		simpleTransitionConfig
	} from 'svelte-flexiboards';
	import type {
		FlexiBoardConfiguration,
		FlexiWidgetController,
		ResponsiveFlexiBoardController,
		ResponsiveFlexiLayout
	} from 'svelte-flexiboards';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AppSidebar from '$lib/components/examples/flexiboard/app-sidebar.svelte';
	import DashboardTile from '$lib/components/examples/flexiboard/dashboard-tile.svelte';
	import { browser } from '$app/environment';
	import Pencil from 'lucide-svelte/icons/pencil';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import Check from 'lucide-svelte/icons/check';
	import { fly } from 'svelte/transition';

	const STORAGE_KEY = 'flexiboards-dashboard-responsive-layout';

	const DEFAULT_LAYOUTS: ResponsiveFlexiLayout = {
		lg: {
			left: [
				{ type: 'immovable', x: 0, y: 0, width: 1, height: 1, metadata: { type: 'score' } },
				{ type: 'default', x: 1, y: 0, width: 1, height: 1, metadata: { type: 'revenue' } },
				{ type: 'default', x: 2, y: 0, width: 1, height: 1, metadata: { type: 'subscriptions' } },
				{ type: 'default', x: 0, y: 1, width: 3, height: 1, metadata: { type: 'sales' } },
				{ type: 'default', x: 0, y: 2, width: 1, height: 1, metadata: { type: 'active' } }
			]
		},
		default: {
			left: [
				{ type: 'immovable', x: 0, y: 0, width: 1, height: 1, metadata: { type: 'score' } },
				{ type: 'default', x: 1, y: 0, width: 1, height: 1, metadata: { type: 'revenue' } },
				{ type: 'default', x: 0, y: 1, width: 1, height: 1, metadata: { type: 'subscriptions' } },
				{ type: 'default', x: 1, y: 1, width: 1, height: 1, metadata: { type: 'active' } },
				{ type: 'default', x: 0, y: 2, width: 2, height: 1, metadata: { type: 'sales' } }
			]
		}
	};

	let editMode = $state(false);
	let responsiveBoard: ResponsiveFlexiBoardController | undefined = $state();

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggability: 'none',
			resizability: 'none'
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

	function toggleEditMode() {
		editMode = !editMode;
		boardConfig.widgetDefaults = {
			draggability: editMode ? 'full' : 'none',
			resizability: editMode ? 'horizontal' : 'none'
		};
	}

	function resetLayout() {
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
		responsiveBoard?.importLayout(DEFAULT_LAYOUTS);
	}

	function saveAndExit() {
		// Layout is already auto-saved, just exit edit mode
		toggleEditMode();
	}
</script>

<Sidebar.Provider class="h-full min-h-0 grow">
	<AppSidebar />
	<main
		class="relative flex min-h-0 w-full grow flex-col gap-6 px-4 py-6 lg:gap-8 lg:px-16 lg:py-8"
	>
		<header class="flex shrink-0 items-center justify-between">
			<div class="flex items-center gap-3">
				<Sidebar.Trigger class="lg:hidden" />
				<h1 class="text-2xl font-semibold lg:text-3xl">Dashboard</h1>
			</div>
			{#if !editMode}
				<Button variant="outline" size="icon" onclick={toggleEditMode} title="Edit layout">
					<Pencil class="size-4" />
				</Button>
			{/if}
		</header>

		<ResponsiveFlexiBoard
			bind:controller={responsiveBoard}
			config={{
				breakpoints: {
					lg: 1024
				},
				loadLayouts: () => {
					if (!browser) return DEFAULT_LAYOUTS;
					const saved = localStorage.getItem(STORAGE_KEY);
					if (saved) {
						try {
							return JSON.parse(saved) as ResponsiveFlexiLayout;
						} catch {
							return DEFAULT_LAYOUTS;
						}
					}
					return DEFAULT_LAYOUTS;
				},
				onLayoutsChange: (layouts) => {
					if (browser) {
						localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
					}
				}
			}}
		>
			{#snippet lg()}
				<FlexiBoard
					class={'dashboard-board min-h-0 grow overflow-x-clip overflow-y-scroll'}
					config={boardConfig}
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
								collapsibility: 'any',
								packing: 'vertical'
							},
							widgetDefaults: {
								transition: simpleTransitionConfig()
							}
						}}
					/>
				</FlexiBoard>
			{/snippet}

			{#snippet children({ currentBreakpoint })}
				<FlexiBoard class={'min-h-0 grow overflow-x-clip overflow-y-scroll'} config={boardConfig}>
					<FlexiTarget
						key="left"
						class={'h-full gap-2 overflow-x-clip'}
						config={{
							rowSizing: 'minmax(0, 160px)',
							layout: {
								type: 'free',
								minColumns: 2,
								maxColumns: 2,
								minRows: 3,
								maxRows: 5,
								collapsibility: 'any',
								packing: 'vertical'
							},
							widgetDefaults: {
								transition: simpleTransitionConfig()
							}
						}}
					/>
				</FlexiBoard>
			{/snippet}
		</ResponsiveFlexiBoard>

		<!-- Edit mode bottom bar -->
		{#if editMode}
			<div
				class="absolute inset-x-4 bottom-4 lg:inset-x-16 lg:bottom-8"
				transition:fly={{ y: 20, duration: 200 }}
			>
				<div
					class="bg-card/95 supports-[backdrop-filter]:bg-card/80 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 shadow-lg backdrop-blur"
				>
					<div class="flex items-center gap-2">
						<div class="bg-primary/10 flex size-8 items-center justify-center rounded-full">
							<Pencil class="text-primary size-4" />
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-medium">Editing layout</span>
							<span class="text-muted-foreground hidden text-xs sm:block"
								>Drag and resize widgets to customise</span
							>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="ghost" size="sm" onclick={resetLayout}>
							<RotateCcw class="mr-1.5 size-4" />
							<span class="hidden sm:inline">Reset</span>
						</Button>
						<Button size="sm" onclick={saveAndExit}>
							<Check class="mr-1.5 size-4" />
							Done
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</main>
</Sidebar.Provider>
