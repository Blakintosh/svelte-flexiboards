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

<!-- Numbers are mono; a rise reads blue, a fall takes vermillion so it is noticed. -->
<div class="flex flex-col gap-2">
	<div class="flex items-baseline gap-2">
		<span class="font-mono text-3xl text-ink lg:text-4xl">{score}</span>
		<span class="font-mono text-sm text-faint">/100</span>
	</div>
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
