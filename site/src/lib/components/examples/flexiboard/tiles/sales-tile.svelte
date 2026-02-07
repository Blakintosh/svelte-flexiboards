<script module lang="ts">
	export type SalesTileProps = {
		count: string;
		change: string;
		isWide?: boolean;
		chartOnly?: boolean;
	};
</script>

<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import TrendingDown from 'lucide-svelte/icons/trending-down';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { BarChart } from 'layerchart';
	import ChartContainer from '$lib/components/ui/chart/chart-container.svelte';

	let { count, change, isWide = false, chartOnly = false }: SalesTileProps = $props();

	const isPositive = change.startsWith('+');

	// Chart data
	const chartData = [
		{ day: 'Mon', sales: 186 },
		{ day: 'Tue', sales: 305 },
		{ day: 'Wed', sales: 237 },
		{ day: 'Thu', sales: 273 },
		{ day: 'Fri', sales: 409 },
		{ day: 'Sat', sales: 214 },
		{ day: 'Sun', sales: 182 }
	];

	const chartConfig = {
		sales: { label: 'Sales', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	// Simple bar chart data for compact view
	const bars = [65, 45, 78, 52, 88, 70, 95];
	const maxBar = Math.max(...bars);
</script>

{#if chartOnly}
	<!-- Chart only mode for wide layout right side -->
	<ChartContainer config={chartConfig} class="!aspect-auto h-full w-full">
		<BarChart
			data={chartData}
			x="day"
			y="sales"
			props={{
				bar: {
					radius: 4,
					fill: 'var(--color-sales)',
					'fill-opacity': 0.8
				},
				xAxis: {
					format: (v: string) => v.slice(0, 1)
				},
				yAxis: { format: () => '' }
			}}
		>
			{#snippet tooltip()}
				<Chart.Tooltip labelKey="day" />
			{/snippet}
		</BarChart>
	</ChartContainer>
{:else}
	<!-- Stats display -->
	<div class="flex flex-col gap-2">
		<div class="text-3xl font-bold lg:text-4xl">{count}</div>
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
