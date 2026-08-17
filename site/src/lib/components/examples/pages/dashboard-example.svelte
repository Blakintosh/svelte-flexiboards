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
				// Provisional states are dashed vermillion, never a pulse or a lift.
				className: (widget: FlexiWidgetController) => [
					widget.isGrabbed && 'border border-vermillion opacity-60',
					widget.isShadow && 'border border-dashed border-vermillion bg-tint-accent opacity-70'
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
		class="relative flex min-h-0 w-full grow flex-col gap-6 bg-paper px-4 py-6 lg:gap-8 lg:px-16 lg:py-8"
	>
		<header class="flex shrink-0 items-center justify-between border-b border-rule pb-4">
			<div class="flex items-baseline gap-3">
				<Sidebar.Trigger class="lg:hidden" />
				<h1 class="font-serif text-2xl text-ink lg:text-[30px]">Dashboard</h1>
				<span class="label hidden text-[10px] text-faint lg:inline">3 × 4 · free · responsive</span>
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
					class={'dashboard-board min-h-0 grow overflow-x-clip overflow-y-auto'}
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
				<FlexiBoard class={'min-h-0 grow overflow-x-clip overflow-y-auto'} config={boardConfig}>
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
				<!-- Edit mode is a state, so the bar is a vermillion callout: 2px left rule, tinted ground. -->
				<div
					class="flex items-center justify-between gap-4 border border-l-2 border-rule border-l-vermillion bg-tint-accent px-4 py-3"
				>
					<div class="flex items-center gap-3">
						<Pencil class="size-4 shrink-0 text-vermillion" />
						<div class="flex flex-col">
							<span class="label text-[10px] text-vermillion">Editing layout</span>
							<span class="hidden text-[13px] text-body sm:block"
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
