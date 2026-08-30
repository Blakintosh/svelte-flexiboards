<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		ResponsiveFlexiBoard,
		cssTransitionConfig,
		springTransitionConfig
	} from '@flexiboards/svelte';
	import type {
		FlexiBoardConfiguration,
		FlexiTargetController,
		FlexiWidgetController,
		ResponsiveFlexiBoardController,
		ResponsiveFlexiLayout
	} from '@flexiboards/svelte';
	import Sheet from '$lib/components/examples/common/sheet.svelte';
	import GalleryPlate, { newDeal } from '$lib/components/examples/gallery/gallery-plate.svelte';
	import GalleryToolbar, {
		type Motion
	} from '$lib/components/examples/gallery/gallery-toolbar.svelte';
	import {
		BREAKPOINT_GRIDS,
		DEFAULT_LAYOUTS,
		TARGET_KEY,
		buildShuffledLayouts,
		type Breakpoint
	} from '$lib/components/examples/gallery/plates.js';

	// Anything provisional — the drop preview, the plate in hand — is fx-accent.
	const className = (widget: FlexiWidgetController) => [
		'outline-offset-2 focus-visible:outline-2 focus-visible:outline-fx-accent',
		widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent opacity-70',
		widget.isGrabbed && 'border border-fx-accent opacity-60',
		// The plate in hand greys out wherever the mosaic has no room for it.
		widget.dropRejected && 'border-rule opacity-30 saturate-0'
	];

	let motion: Motion = $state('spring');
	let responsive: ResponsiveFlexiBoardController | undefined = $state();
	let target: FlexiTargetController | undefined = $state();

	// Not reactive: only ever read inside handlers and the one-shot loadLayouts.
	let layouts: ResponsiveFlexiLayout = DEFAULT_LAYOUTS;

	/*
		The transition lives on the board's widget defaults and nowhere else — a
		registry entry would shadow it and dead-lock the toggle. The interpolator
		re-reads it when the next animation starts, so a swap needs no remount.
	*/
	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			transition: springTransitionConfig()
		},
		registry: {
			plate: {
				component: GalleryPlate,
				className,
				draggability: 'full',
				resizability: 'both',
				minWidth: 1,
				minHeight: 1,
				maxWidth: 2,
				maxHeight: 2
			},
			panorama: {
				component: GalleryPlate,
				className,
				draggability: 'full',
				resizability: 'both',
				// A panorama is wide by definition: it can never be made narrow or tall.
				minWidth: 2,
				minHeight: 1,
				maxWidth: 3,
				maxHeight: 1
			}
		}
	});

	const breakpoint = $derived((responsive?.currentBreakpoint ?? 'lg') as Breakpoint);
	const grid = $derived(BREAKPOINT_GRIDS[breakpoint] ?? BREAKPOINT_GRIDS.default);
	const rows = $derived(target?.rows ?? grid.minRows);
	const columns = $derived(target?.columns ?? grid.columns);

	// The fig band reads out whichever config the board is actually running on.
	const transitionCall = $derived(
		motion === 'spring' ? 'springTransitionConfig()' : 'cssTransitionConfig()'
	);

	function setMotion(next: Motion) {
		motion = next;
		boardConfig.widgetDefaults = {
			...boardConfig.widgetDefaults,
			transition: next === 'spring' ? springTransitionConfig() : cssTransitionConfig()
		};
	}

	function shuffle() {
		layouts = buildShuffledLayouts(layouts);
		newDeal();
		responsive?.importLayout(layouts);
	}

	function reset() {
		layouts = DEFAULT_LAYOUTS;
		newDeal();
		responsive?.importLayout(layouts);
	}
</script>

{#snippet plateBoard(bp: Breakpoint)}
	{@const bpGrid = BREAKPOINT_GRIDS[bp]}
	<FlexiBoard class={'min-h-0 grow overflow-x-clip overflow-y-auto [scrollbar-gutter:stable]'} config={boardConfig}>
		<FlexiTarget
			key={TARGET_KEY}
			onfirstcreate={(created: FlexiTargetController) => (target = created)}
			class={'h-full gap-3 overflow-x-clip lg:gap-4'}
			config={{
				rowSizing: bpGrid.rowSizing,
				layout: {
					type: 'free',
					minColumns: bpGrid.columns,
					maxColumns: bpGrid.columns,
					minRows: bpGrid.minRows,
					maxRows: bpGrid.maxRows,
					collapsibility: 'any',
					// A mosaic is a composition: nothing re-packs behind the user's back.
					packing: 'none'
				}
			}}
		/>
	</FlexiBoard>
{/snippet}

<main class="bg-paper flex h-full min-h-0 w-full flex-col p-3 sm:p-4 lg:p-6">
	<Sheet
		class="min-h-0 flex-1"
		fig="Fig 10 · Gallery · free 2D grid · packing: none"
		aside="transition: {transitionCall}"
	>
		<!-- The toolbar lives in the sheet's own header rather than a band of its own. -->
		<header
			class="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4 pb-3 lg:px-9 lg:pt-5"
		>
			<div class="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
				<h1 class="text-ink font-serif text-2xl lg:text-[30px]">Gallery</h1>
				<!-- The row count is live: it ticks up when a resize grows the grid. -->
				<span class="label text-faint text-[10px]">
					{columns} × {rows} · rows {grid.minRows}–{grid.maxRows} · neighbours make room
				</span>
			</div>

			<GalleryToolbar {motion} onMotionChange={setMotion} onShuffle={shuffle} onReset={reset} />
		</header>

		<!-- Touch grabs are a long press by default, so say so rather than let a tap fail. -->
		<p class="text-body shrink-0 px-4 pb-3 text-[13px] lg:px-9">
			<span class="hidden sm:inline">
				Drag a plate to move it. Drag the corner mark to resize.
			</span>
			<span class="sm:hidden">Press and hold a plate to move it.</span>
		</p>

		<div class="flex min-h-0 flex-1 flex-col px-4 pb-4 lg:px-9 lg:pb-5">
			<ResponsiveFlexiBoard
				bind:controller={responsive}
				config={{
					breakpoints: { lg: 1024, sm: 640 },
					loadLayouts: () => layouts
				}}
			>
				{#snippet lg()}
					{@render plateBoard('lg')}
				{/snippet}
				{#snippet sm()}
					{@render plateBoard('sm')}
				{/snippet}
				{#snippet children()}
					{@render plateBoard('default')}
				{/snippet}
			</ResponsiveFlexiBoard>
		</div>
	</Sheet>
</main>
