<script module lang="ts">
	export type SubscriptionsTileProps = {
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
	import { LineChart } from 'layerchart';
	import { curveNatural } from 'd3-shape';
	import ChartContainer from '$lib/components/ui/chart/chart-container.svelte';

	let { count, change, isWide = false, chartOnly = false }: SubscriptionsTileProps = $props();

	const isPositive = change.startsWith('+');

	// Chart data
	const chartData = [
		{ month: 'Jan', subs: 1200 },
		{ month: 'Feb', subs: 1400 },
		{ month: 'Mar', subs: 1800 },
		{ month: 'Apr', subs: 2100 },
		{ month: 'May', subs: 1900 },
		{ month: 'Jun', subs: 2350 }
	];

	const chartConfig = {
		subs: { label: 'Subscriptions', color: 'var(--chart-3)' }
	} satisfies Chart.ChartConfig;
</script>

{#if chartOnly}
	<!-- Chart only mode for wide layout right side -->
	<ChartContainer config={chartConfig} class="!aspect-auto h-full w-full">
		<LineChart
			data={chartData}
			x="month"
			y="subs"
			props={{
				spline: {
					curve: curveNatural,
					class: 'stroke-[var(--color-subs)] stroke-2'
				},
				points: {
					r: 4,
					fill: 'var(--color-subs)'
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
		</LineChart>
	</ChartContainer>
{:else}
	<!-- Stats display -->
	<div class="flex flex-col gap-2">
		<div class="font-mono text-3xl text-ink lg:text-4xl">{count}</div>
		<div class="flex items-center gap-1.5">
			{#if isPositive}
				<TrendingUp class="size-3.5 text-blue" />
				<p class="font-mono text-[11px] text-blue">{change}</p>
			{:else}
				<TrendingDown class="size-3.5 text-vermillion" />
				<p class="font-mono text-[11px] text-vermillion">{change}</p>
			{/if}
		</div>
	</div>
{/if}
