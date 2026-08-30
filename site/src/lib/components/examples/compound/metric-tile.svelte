<script module lang="ts">
	export type MetricTileProps = {
		value: string;
		delta: string;
		positive?: boolean;
		/** Six values, 0–100, drawn as a bar strip. Divs, not a chart library. */
		bars: number[];
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { value, delta, positive = false, bars }: MetricTileProps = $props();
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col justify-center gap-0.5">
	<div class="flex min-w-0 items-end justify-between gap-2">
		<span class="text-ink truncate font-mono text-xl lg:text-3xl">{value}</span>
		<!-- Sparkline: drafting blue on a tint track, board furniture rather than decoration. -->
		<div class="hidden h-8 shrink-0 items-end gap-[3px] lg:flex" aria-hidden="true">
			{#each bars as bar, i (i)}
				<div class="bg-tint flex h-full w-[5px] items-end">
					<div class="bg-blue w-full" style:height={`${bar}%`}></div>
				</div>
			{/each}
		</div>
	</div>
	<span
		class={cn(
			'truncate font-mono text-[10px] lg:text-[11px]',
			positive ? 'text-blue' : 'text-faint'
		)}
	>
		{delta}
	</span>
</div>
