<script module lang="ts">
	export type RevenueTileProps = {
		amount: string;
		change: string;
		isWide?: boolean;
		chartOnly?: boolean;
	};
</script>

<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import TrendingDown from 'lucide-svelte/icons/trending-down';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { AreaChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import ChartContainer from '$lib/components/ui/chart/chart-container.svelte';

	let { amount, change, isWide = false, chartOnly = false }: RevenueTileProps = $props();

	const isPositive = change.startsWith('+');

	// Chart data
	const chartData = [
		{ month: 'Jan', revenue: 18600 },
		{ month: 'Feb', revenue: 30500 },
		{ month: 'Mar', revenue: 23700 },
		{ month: 'Apr', revenue: 27300 },
		{ month: 'May', revenue: 40900 },
		{ month: 'Jun', revenue: 45200 }
	];

	const chartConfig = {
		revenue: { label: 'Revenue', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;
</script>

{#if chartOnly}
	<!-- Chart only mode for wide layout right side -->
	<ChartContainer config={chartConfig} class="!aspect-auto h-full w-full">
		<AreaChart
			data={chartData}
			x="month"
			y="revenue"
			props={{
				area: {
					curve: curveNatural,
					fill: 'var(--color-revenue)',
					'fill-opacity': 0.3,
					line: { class: 'stroke-[var(--color-revenue)] stroke-2' }
				},
				xAxis: {
					format: (v: string) => v.slice(0, 1)
				},
				yAxis: { format: () => '' }
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip labelKey="month" />
			{/snippet}
		</AreaChart>
	</ChartContainer>
{:else}
	<!-- Stats display -->
	<div class="flex flex-col gap-2">
		<div class="text-3xl font-bold lg:text-4xl">{amount}</div>
		<div class="flex items-center gap-1.5">
			{#if isPositive}
				<TrendingUp class="size-3.5 text-emerald-500" />
				<p class="text-xs text-emerald-600 dark:text-emerald-400">{change}</p>
			{:else}
				<TrendingDown class="size-3.5 text-rose-500" />
				<p class="text-xs text-rose-600 dark:text-rose-400">{change}</p>
			{/if}
		</div>
	</div>
{/if}
