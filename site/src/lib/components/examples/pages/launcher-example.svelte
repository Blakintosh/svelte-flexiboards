<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		ResponsiveFlexiBoard,
		cssTransitionConfig
	} from '@flexiboards/svelte';
	import type { FlexiBoardSuspenseReason } from '@flexiboards/svelte';
	import BoardSkeleton from '$lib/components/examples/common/board-skeleton.svelte';
	import type {
		BreakpointSnippetParams,
		FlexiBoardConfiguration,
		FlexiTargetController,
		FlexiWidgetController,
		ResponsiveFlexiBoardController,
		ResponsiveFlexiLayout
	} from '@flexiboards/svelte';

	import { cn } from '$lib/utils.js';
	import BreakpointSwitcher from '$lib/components/examples/launcher/breakpoint-switcher.svelte';
	import LayoutJsonBar, {
		type CopyState
	} from '$lib/components/examples/launcher/layout-json-bar.svelte';
	import LauncherAppTile from '$lib/components/examples/launcher/launcher-app-tile.svelte';
	import LauncherClockTile from '$lib/components/examples/launcher/launcher-clock-tile.svelte';
	import LauncherWeatherTile from '$lib/components/examples/launcher/launcher-weather-tile.svelte';
	import LauncherNowPlayingTile from '$lib/components/examples/launcher/launcher-now-playing-tile.svelte';
	import {
		BREAKPOINTS,
		DEFAULT_LAYOUTS,
		breakpointsFor,
		formatLayouts,
		isBreakpointKey,
		plateWidth,
		type Pin
	} from '$lib/components/examples/launcher/layouts.js';

	// A home-screen icon is its own handle, so tiles are grabbed whole — no grip
	// chrome. With no grabbers the library makes the widget root focusable and
	// keyboard-operable for free; all this adds is the focus ring.
	const FOCUS_RING =
		'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fx-accent';
	const APP_BASE =
		'flex cursor-grab select-none overflow-hidden rounded-[10px] border border-rule-soft bg-tint active:cursor-grabbing';
	const PANEL_BASE =
		'flex cursor-grab select-none overflow-hidden rounded-[10px] border border-rule-soft bg-panel shadow-card active:cursor-grabbing';
	const FEATURE_BASE =
		'flex cursor-grab select-none overflow-hidden rounded-[10px] border border-rule-soft bg-panel shadow-card active:cursor-grabbing';

	// Provisional states — the tile in hand, the drop shadow — are the only
	// fx-accent on the page. Routed through cn() so the lifted/placeholder look
	// reliably beats the resting one.
	const tileClass = (base: string) => (widget: FlexiWidgetController) =>
		cn(
			base,
			FOCUS_RING,
			// In hand: no accent border, just a lift off the plate and a small tilt.
			'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
			widget.isGrabbed && 'shadow-lift rotate-[2.5deg] opacity-95',
			// Nowhere to go: the tile in hand fades and greys until it is somewhere it fits.
			widget.dropRejected && 'border-rule-soft opacity-30 saturate-0',
			widget.isShadow && 'border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent'
		);

	// Never $state: this configuration genuinely never changes.
	const boardConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggability: 'full',
			resizability: 'none',
			transition: cssTransitionConfig()
		},
		registry: {
			// importLayout() resolves every entry's `type` here, and sizes come from
			// the layout entries — the registry can't carry width/height, so matched
			// min/max lock each tile to its intended footprint instead.
			app: {
				component: LauncherAppTile,
				className: tileClass(APP_BASE),
				minWidth: 1,
				maxWidth: 1,
				minHeight: 1,
				maxHeight: 1
			},
			clock: {
				component: LauncherClockTile,
				className: tileClass(PANEL_BASE),
				minWidth: 2,
				maxWidth: 2,
				minHeight: 1,
				maxHeight: 1
			},
			weather: {
				component: LauncherWeatherTile,
				className: tileClass(PANEL_BASE),
				minWidth: 2,
				maxWidth: 2,
				minHeight: 1,
				maxHeight: 1
			},
			'now-playing': {
				component: LauncherNowPlayingTile,
				className: tileClass(FEATURE_BASE),
				minWidth: 2,
				maxWidth: 2,
				minHeight: 2,
				maxHeight: 2
			}
		}
	};

	let pin: Pin = $state('auto');
	let copyState: CopyState = $state('idle');
	let liveLayouts: ResponsiveFlexiLayout = $state(structuredClone(DEFAULT_LAYOUTS));
	let board: ResponsiveFlexiBoardController | undefined = $state();
	// The target's widget set is reactive, so asking it who is in hand needs no
	// per-tile plumbing. The layout only re-exports on drop, so the marked
	// coordinates are the ones the tile is leaving — they tick over as it lands.
	let apps: FlexiTargetController | undefined = $state();

	const grabbedId = $derived.by(() => {
		for (const widget of apps?.widgets ?? []) {
			if (widget.isGrabbed) return widget.metadata?.tile as string | undefined;
		}
		return undefined;
	});

	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	// Deliberately in-memory: a returning visitor always meets the designed
	// arrangement, and Reset needs no storage-clearing branch. onLayoutsChange
	// feeds the live JSON panel, which teaches the callback better than a
	// silent localStorage write would.
	function loadLayouts(): ResponsiveFlexiLayout {
		return structuredClone(DEFAULT_LAYOUTS);
	}

	function onLayoutsChange(layouts: ResponsiveFlexiLayout) {
		liveLayouts = layouts;
	}

	// Identity stays put while `pin` does, so the prop seam is inert; when it
	// changes, only the threshold *values* differ — which is exactly what the
	// controller's shallow comparison notices.
	const responsiveConfig = $derived({
		breakpoints: breakpointsFor(pin),
		// Server renders can't match a media query; assume the desktop plate so
		// the pre-hydration skeleton has the width most visitors will end up with.
		ssrBreakpoint: 'lg',
		loadLayouts,
		onLayoutsChange
	});

	const json = $derived(formatLayouts(liveLayouts));

	function setCopyState(next: CopyState, resetAfter = 1600) {
		if (copyTimeout) clearTimeout(copyTimeout);
		copyState = next;
		if (next !== 'idle') {
			copyTimeout = setTimeout(() => {
				copyState = 'idle';
				copyTimeout = null;
			}, resetAfter);
		}
	}

	async function copyLayout() {
		const layouts = board?.exportLayout();
		if (layouts) {
			liveLayouts = layouts;
		}

		try {
			await navigator.clipboard.writeText(formatLayouts(layouts ?? liveLayouts));
			setCopyState('copied');
		} catch {
			// Fall back to a manual copy rather than failing silently.
			setCopyState('failed', 6000);
		}
	}

	function resetLayout() {
		const layouts = structuredClone(DEFAULT_LAYOUTS);
		// Every breakpoint reverts, not just the visible one. The pin is left
		// alone: which layout you're looking at is a different axis from what
		// the layouts contain.
		board?.importLayout(layouts);
		liveLayouts = layouts;
	}
</script>

<!--
	The JSON bar docks flush to the bottom edge, so the page gutters live on the
	sections rather than on <main>.
-->
<main class="bg-paper flex h-full min-h-0 w-full flex-col overflow-hidden">
	<header
		class="border-rule-soft mx-4 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b pt-4 pb-3 sm:pt-5 lg:mx-12 lg:pt-8"
	>
		<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<h1 class="text-ink font-serif text-2xl lg:text-[28px]">Launcher</h1>
			<span class="text-faint text-[12px]">one widget set · three arrangements</span>
		</div>
		<BreakpointSwitcher value={pin} onchange={(next) => (pin = next)} />
	</header>

	<!-- Only the board region scrolls, so the switcher and the JSON bar never leave. Recessed stage ground behind the plate. -->
	<div class="bg-stage min-h-0 w-full flex-1 overflow-y-auto px-4 py-4 lg:px-12 lg:py-6">
		<div class="flex min-h-full w-full items-center justify-center">
			<ResponsiveFlexiBoard bind:controller={board} config={responsiveConfig}>
				{#snippet children({ currentBreakpoint }: BreakpointSnippetParams)}
					{@const key = isBreakpointKey(currentBreakpoint) ? currentBreakpoint : 'sm'}
					{@const bp = BREAKPOINTS[key]}

					<FlexiBoard
						class="flex w-full shrink-0 items-center justify-center py-1"
						config={boardConfig}
					>
						{#snippet suspense(_: FlexiBoardSuspenseReason)}
							<BoardSkeleton bars={4} class="max-w-[520px]" />
						{/snippet}
						<!-- The plate is the figure: soft rounded card, panel ground, resting shadow. -->
						<div
							class={cn(
								'border-rule-soft bg-panel shadow-card flex w-full flex-col rounded-[14px] border',
								bp.padClass
							)}
							style="max-width: {plateWidth(bp)}px"
						>
							<FlexiTarget
								bind:controller={apps}
								key="apps"
								class={cn('w-full', bp.gapClass)}
								config={{
									rowSizing: `minmax(0, ${bp.cell}px)`,
									columnSizing: 'minmax(0, 1fr)',
									layout: {
										type: 'free',
										minColumns: bp.columns,
										maxColumns: bp.columns,
										minRows: bp.rows,
										maxRows: bp.rows,
										// A home screen: tiles stay where you drop them and gaps are fine.
										collapsibility: 'none',
										packing: 'none'
									}
								}}
							/>

							<div
								class="border-rule-faint mt-2.5 flex items-center justify-between gap-2 border-t pt-2"
								role="status"
							>
								<span class="text-faint text-[9px] font-semibold whitespace-nowrap"
									>{key} · {bp.grid}</span
								>
								<!--
									The long half is gated on the *breakpoint*, not the viewport: the strip
									sits on the plate, and the plate is 212px wide at sm however wide the
									window is.
								-->
								<span class="text-faint truncate text-[9px] font-semibold whitespace-nowrap">
									{#if pin === 'auto'}
										Auto{#if key !== 'sm'}&nbsp;· follows viewport{/if}
									{:else}
										Pinned{#if key !== 'sm'}&nbsp;· click auto to release{/if}
									{/if}
								</span>
							</div>
						</div>
					</FlexiBoard>
				{/snippet}
			</ResponsiveFlexiBoard>
		</div>
	</div>

	<LayoutJsonBar
		{json}
		{copyState}
		highlightId={grabbedId}
		oncopy={copyLayout}
		onreset={resetLayout}
	/>
</main>
