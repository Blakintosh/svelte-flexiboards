<script lang="ts">
	import type { BreakpointSnippetParams } from '@flexiboards/svelte';
	import type { FlexiBoardSuspenseReason } from '@flexiboards/svelte';
	import BoardSkeleton from '$lib/components/examples/common/board-skeleton.svelte';
	import {
		FlexiBoard,
		FlexiTarget,
		ResponsiveFlexiBoard,
		simpleTransitionConfig
	} from '@flexiboards/svelte';
	import type {
		FlexiBoardConfiguration,
		FlexiWidgetController,
		ResponsiveFlexiBoardController,
		ResponsiveFlexiLayout
	} from '@flexiboards/svelte';
	import Button from '$lib/components/examples/common/button.svelte';
	import AppSidebar from '$lib/components/examples/flexiboard/app-sidebar.svelte';
	import DashboardTile from '$lib/components/examples/flexiboard/dashboard-tile.svelte';
	import Sheet from '$lib/components/examples/common/sheet.svelte';
	import { browser } from '$app/environment';
	import Pencil from 'lucide-svelte/icons/pencil';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import Check from 'lucide-svelte/icons/check';

	// Bumped when the tile set changed (score/sales → mrr/churn/revenue), so a
	// stale saved layout can't resurrect widget types that no longer exist.
	const STORAGE_KEY = 'flexiboards-dashboard-responsive-layout-v2';

	const DEFAULT_LAYOUTS: ResponsiveFlexiLayout = {
		lg: {
			left: [
				{ type: 'immovable', x: 0, y: 0, width: 1, height: 1, metadata: { type: 'mrr' } },
				{ type: 'default', x: 1, y: 0, width: 1, height: 1, metadata: { type: 'subscriptions' } },
				{ type: 'default', x: 2, y: 0, width: 1, height: 1, metadata: { type: 'churn' } },
				{ type: 'default', x: 0, y: 1, width: 3, height: 1, metadata: { type: 'revenue' } },
				{ type: 'default', x: 0, y: 2, width: 1, height: 1, metadata: { type: 'active' } }
			]
		},
		default: {
			left: [
				{ type: 'immovable', x: 0, y: 0, width: 1, height: 1, metadata: { type: 'mrr' } },
				{ type: 'default', x: 1, y: 0, width: 1, height: 1, metadata: { type: 'subscriptions' } },
				{ type: 'default', x: 0, y: 1, width: 1, height: 1, metadata: { type: 'churn' } },
				{ type: 'default', x: 1, y: 1, width: 1, height: 1, metadata: { type: 'active' } },
				{ type: 'default', x: 0, y: 2, width: 2, height: 1, metadata: { type: 'revenue' } }
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
				// Grabbed tiles lift and tilt rather than taking an accent border;
				// the drop placeholder stays a soft dashed plate, never a pulse.
				className: (widget: FlexiWidgetController) => [
					'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
					widget.isGrabbed && 'shadow-lift rotate-[2.5deg]',
					widget.isShadow &&
						'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent'
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

<div class="flex h-full min-h-0 w-full grow">
	<AppSidebar />
	<main class="bg-paper flex min-h-0 w-full grow flex-col p-4 lg:p-6">
		<!--
			The sheet's caption band names the grid; the aside carries the one live
			status this example has — an accent pill while it is being edited.
		-->
		<Sheet
			class="min-h-0 flex-1"
			fig="Dashboard · 3 × 4 free grid · responsive"
			aside={editMode ? '● Editing' : undefined}
			footer={editMode ? editFooter : undefined}
			asideClass="bg-tint-accent text-fx-accent-hover rounded-full px-2.5 py-1 font-sans text-[11px] font-bold"
			footerClass="bg-tint-accent"
			bodyClass="gap-4 p-4 lg:gap-5 lg:p-8"
		>
			<header class="flex shrink-0 items-center justify-between gap-4">
				<div class="flex items-baseline gap-3">
					<h1 class="text-ink font-serif text-2xl lg:text-[28px]">Overview</h1>
					<span class="text-faint font-mono text-[11px]">March 2026</span>
				</div>
				{#if !editMode}
					<Button
						variant="outline"
						size="icon"
						class="rounded-full"
						onclick={toggleEditMode}
						title="Edit layout"
					>
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
					ssrBreakpoint: 'lg',
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
					onLayoutsChange: (layouts: ResponsiveFlexiLayout) => {
						if (browser) {
							localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
						}
					}
				}}
			>
				{#snippet lg()}
					<FlexiBoard
						class={'dashboard-board min-h-0 grow overflow-y-auto overflow-x-clip'}
						config={boardConfig}
					>
						{#snippet suspense(_: FlexiBoardSuspenseReason)}
							<BoardSkeleton bars={4} class="" />
						{/snippet}
						<FlexiTarget
							key="left"
							class={'h-full gap-2 overflow-x-clip lg:gap-3.5'}
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

				{#snippet children({ currentBreakpoint }: BreakpointSnippetParams)}
					<FlexiBoard class={'min-h-0 grow overflow-y-auto overflow-x-clip'} config={boardConfig}>
						{#snippet suspense(_: FlexiBoardSuspenseReason)}
							<BoardSkeleton bars={4} class="" />
						{/snippet}
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
		</Sheet>
	</main>
</div>

<!--
	Declared outside the sheet so it can be handed over only in edit mode: the
	band under the figure answers in fx-accent, because editing is a state.
-->
{#snippet editFooter()}
	<div class="flex items-center gap-3">
		<Pencil class="text-fx-accent size-4 shrink-0" />
		<div class="flex flex-col">
			<span class="text-fx-accent text-[11.5px] font-semibold">Editing layout</span>
			<span class="text-body hidden text-[12px] sm:block">Drag and resize widgets to customise</span
			>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="sm" class="rounded-full" onclick={resetLayout}>
			<RotateCcw class="mr-1.5 size-4" />
			<span class="hidden sm:inline">Reset</span>
		</Button>
		<Button size="sm" class="rounded-full" onclick={saveAndExit}>
			<Check class="mr-1.5 size-4" />
			Done
		</Button>
	</div>
{/snippet}
