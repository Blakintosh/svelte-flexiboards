<script module lang="ts">
	export type ScoreTileProps = {
		score: number;
		change: string;
		isWide?: boolean;
		chartOnly?: boolean;
	};
</script>

<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
	import TrendingDown from 'lucide-svelte/icons/trending-down';

	let { score, change, isWide = false, chartOnly = false }: ScoreTileProps = $props();

	const isPositive = change.startsWith('+');
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-baseline gap-2">
		<span class="text-3xl font-bold lg:text-4xl">{score}</span>
		<span class="text-muted-foreground text-sm">/100</span>
	</div>
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
