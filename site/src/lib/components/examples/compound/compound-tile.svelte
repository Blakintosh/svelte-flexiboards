<script module lang="ts">
	import type { MetricTileProps } from './metric-tile.svelte';
	import type { LatencyTileProps } from './latency-tile.svelte';

	export type TileKind = 'deploys' | 'errors' | 'uptime' | 'team' | 'tasks' | 'latency';
	export type MetricKind = 'deploys' | 'errors' | 'uptime';

	export type CompoundTileProps = {
		kind: TileKind;
		onCommit: (scope: 'compound' | 'team' | 'tasks') => void;
	};

	/** Title, and — for the two tiles that are themselves boards — the board's name. */
	const info: Record<TileKind, { title: string; board?: string }> = {
		deploys: { title: 'Deploys' },
		errors: { title: 'Error rate' },
		uptime: { title: 'Uptime 30d' },
		team: { title: 'On-call rotation', board: 'board.team' },
		tasks: { title: 'Release queue', board: 'board.tasks' },
		latency: { title: 'P95 latency' }
	};

	const metrics: Record<MetricKind, MetricTileProps> = {
		deploys: {
			value: '18',
			delta: '+4 vs yesterday',
			positive: true,
			bars: [22, 34, 48, 66, 80, 100]
		},
		errors: {
			value: '0.42%',
			delta: '−0.08 pts',
			positive: true,
			bars: [100, 84, 66, 48, 34, 26]
		},
		uptime: {
			value: '99.98%',
			delta: '0 incidents',
			positive: false,
			bars: [96, 100, 98, 100, 100, 99]
		}
	};

	const latency: LatencyTileProps = {
		value: '214 ms',
		series: [
			{ at: '00:00', pct: 62 },
			{ at: '04:00', pct: 48 },
			{ at: '08:00', pct: 96 },
			{ at: '12:00', pct: 71 },
			{ at: '16:00', pct: 84 }
		]
	};
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Grabber from '$lib/components/examples/common/grabber.svelte';
	import MetricTile from './metric-tile.svelte';
	import LatencyTile from './latency-tile.svelte';
	import TeamBoard from './team-board.svelte';
	import TasksBoard from './tasks-board.svelte';

	let { kind, onCommit }: CompoundTileProps = $props();

	const tile = $derived(info[kind]);
</script>

<Card.Root
	class="border-rule bg-panel flex h-full w-full min-w-0 flex-col gap-0 py-0 shadow-none"
	data-tile-kind={kind}
>
	<!--
		The handle is the only way to move a tile, and it is always visible rather
		than hover-revealed. Because the tile has a grabber, the library suppresses
		direct grabs on the tile body — which is exactly what lets the inner boards
		be drag-anywhere.
	-->
	<div class="border-rule flex shrink-0 items-center gap-1 border-b px-1.5 py-1 lg:px-2">
		<Grabber size={16} class="-ml-0.5 p-1 lg:p-1.5 [&_svg]:size-4 lg:[&_svg]:size-5" />
		<span class="label text-faint min-w-0 flex-1 truncate text-[9px] lg:text-[10px]">
			{tile.title}
		</span>
		{#if tile.board}
			<Badge variant="outline" class="hidden shrink-0 sm:inline-flex">{tile.board}</Badge>
		{/if}
	</div>

	<div class="min-h-0 min-w-0 flex-1 px-2 py-2 lg:px-3">
		{#if kind === 'team'}
			<TeamBoard {onCommit} />
		{:else if kind === 'tasks'}
			<TasksBoard {onCommit} />
		{:else if kind === 'latency'}
			<LatencyTile value={latency.value} series={latency.series} />
		{:else}
			<MetricTile {...metrics[kind]} />
		{/if}
	</div>
</Card.Root>
