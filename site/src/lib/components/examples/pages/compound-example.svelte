<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		cssTransitionConfig,
		immediateTriggerConfig,
		type FlexiBoardConfiguration,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import Button from '$lib/components/examples/common/button.svelte';
	import Sheet from '$lib/components/examples/common/sheet.svelte';
	import CompoundTile, {
		type TileKind
	} from '$lib/components/examples/compound/compound-tile.svelte';
	import DropLog, {
		type DropCounts,
		type DropScope
	} from '$lib/components/examples/compound/drop-log.svelte';
	import { cn } from '$lib/utils.js';
	import { onDestroy } from 'svelte';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';

	/**
	 * Three boards are live on this page: the outer free grid of tiles, and the
	 * two inner flow boards that live inside two of those tiles. Each one reports
	 * its own drops, so the log below can name which board took the pointer.
	 */
	let drops: DropCounts = $state({ compound: 0, team: 0, tasks: 0 });
	let flashed: DropScope | null = $state(null);
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	let resetToken = $state(0);

	function commit(scope: DropScope) {
		drops[scope] += 1;
		flashed = scope;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flashed = null), 900);
	}

	function reset() {
		clearTimeout(flashTimer);
		drops = { compound: 0, team: 0, tasks: 0 };
		flashed = null;
		// Remounting the subtree re-flushes the declarative widget registrations,
		// restoring all three boards to their initial arrangement.
		resetToken += 1;
	}

	onDestroy(() => clearTimeout(flashTimer));

	// The drop preview reads as a dashed placeholder; the tile in hand lifts
	// off the stage instead of taking an accent outline.
	const tileClass = (widget: FlexiWidgetController) =>
		cn(
			'min-w-0 motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
			widget.isShadow &&
				'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
			widget.isGrabbed && 'shadow-lift rotate-[2.5deg] rounded-[14px]'
		);

	const outerConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggability: 'full',
			resizability: 'none',
			transition: cssTransitionConfig(),
			// Trigger maps replace wholesale, so all four keys are given. Outer tiles
			// are grabbable only through the header handle, so an immediate touch grab
			// cannot fight page scrolling — unlike the inner boards, which keep the
			// library's long-press default for touch.
			grabTrigger: {
				default: immediateTriggerConfig(),
				mouse: immediateTriggerConfig(),
				touch: immediateTriggerConfig(),
				pen: immediateTriggerConfig()
			}
		},
		registry: {
			tile: { component: CompoundTile, className: tileClass }
		},
		onLayoutChange: () => commit('compound')
	};

	const tiles: { kind: TileKind; x: number; y: number; width: number; height: number }[] = [
		{ kind: 'deploys', x: 0, y: 0, width: 1, height: 1 },
		{ kind: 'errors', x: 1, y: 0, width: 1, height: 1 },
		{ kind: 'uptime', x: 2, y: 0, width: 1, height: 1 },
		{ kind: 'team', x: 0, y: 1, width: 3, height: 1 },
		{ kind: 'tasks', x: 0, y: 2, width: 2, height: 2 },
		{ kind: 'latency', x: 2, y: 2, width: 1, height: 2 }
	];
</script>

<!-- Soft sheet: the nesting claim is annotation, so it belongs in the fig band. -->
<main class="bg-paper flex h-full min-h-0 w-full flex-col p-3 lg:p-5">
	<Sheet
		class="min-h-0 flex-1"
		fig="Compound · nested boards · every drag scoped to its owner"
		aside="3 boards live"
	>
		<div class="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 lg:px-8 lg:pt-5">
			<header class="flex shrink-0 items-baseline justify-between gap-4">
				<div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
					<h1 class="text-ink font-serif text-xl lg:text-[30px]">Ops overview</h1>
					<p class="text-body min-w-0 text-xs lg:text-[13px]">
						Two tiles are themselves boards — drag an avatar; the tile never moves.
					</p>
				</div>
				<Button
					variant="outline"
					size="icon"
					class="rounded-full"
					onclick={reset}
					title="Reset layout"
				>
					<RotateCcw class="size-4" />
					<span class="sr-only">Reset layout</span>
				</Button>
			</header>

			{#key resetToken}
				<FlexiBoard class="min-h-0 grow overflow-y-auto overflow-x-clip" config={outerConfig}>
					<FlexiTarget
						key="tiles"
						class="bg-stage h-full gap-2 overflow-x-clip rounded-[10px] pb-4 lg:pb-5"
						config={{
							rowSizing: 'minmax(0, 7rem)',
							columnSizing: 'minmax(0, 1fr)',
							layout: {
								type: 'free',
								minColumns: 3,
								maxColumns: 3,
								minRows: 4,
								maxRows: 5,
								collapsibility: 'any',
								packing: 'vertical'
							}
						}}
					>
						{#each tiles as tile (tile.kind)}
							<FlexiWidget
								type="tile"
								x={tile.x}
								y={tile.y}
								width={tile.width}
								height={tile.height}
								componentProps={{ kind: tile.kind, onCommit: commit }}
							/>
						{/each}
					</FlexiTarget>
				</FlexiBoard>
			{/key}
		</div>

		{#snippet footer()}
			<DropLog {drops} {flashed} />
		{/snippet}
	</Sheet>
</main>
