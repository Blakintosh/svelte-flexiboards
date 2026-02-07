<script module lang="ts">
	export type ActiveTileProps = {
		count: string;
		change: string;
		isWide?: boolean;
		chartOnly?: boolean;
	};
</script>

<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import Activity from 'lucide-svelte/icons/activity';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart } from 'layerchart';
	import ChartContainer from '$lib/components/ui/chart/chart-container.svelte';

	let { count, change, isWide = false, chartOnly = false }: ActiveTileProps = $props();

	const isPositive = change.startsWith('+');

	// Chart data - active users by browser
	const chartData = [
		{ browser: 'Chrome', users: 245 },
		{ browser: 'Safari', users: 156 },
		{ browser: 'Firefox', users: 89 },
		{ browser: 'Edge', users: 47 },
		{ browser: 'Zen', users: 36 }
	];

	const chartConfig = {
		users: { label: 'Users', color: 'var(--chart-4)' }
	} satisfies Chart.ChartConfig;
</script>

{#if chartOnly}
	<!-- Chart only mode for wide layout right side -->
	<ChartContainer config={chartConfig} class="!aspect-auto h-full w-full">
		<BarChart
			data={chartData}
			x="browser"
			y="users"
			props={{
				bar: {
					radius: 4,
					fill: 'var(--color-users)',
					'fill-opacity': 0.8
				},
				xAxis: {
					format: (v: string) => v.slice(0, 2)
				},
				yAxis: { format: () => '' }
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip labelKey="browser" />
			{/snippet}
		</BarChart>
	</ChartContainer>
{:else}
	<!-- Stats display -->
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<span class="text-3xl font-bold lg:text-4xl">{count}</span>
			<Activity class="size-5 text-emerald-500 animate-pulse" />
		</div>
		<div class="flex items-center gap-1.5">
			{#if isPositive}
				<TrendingUp class="size-3.5 text-emerald-500" />
				<p class="text-xs text-emerald-600 dark:text-emerald-400">{change}</p>
			{:else}
				<p class="text-xs text-muted-foreground">{change}</p>
			{/if}
		</div>
	</div>
{/if}
