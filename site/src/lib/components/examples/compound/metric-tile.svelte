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
		<span class="text-ink truncate font-serif text-xl font-semibold tracking-[-0.01em] lg:text-3xl"
			>{value}</span
		>
		<!-- Sparkline: drafting blue on a tint track, the latest reading in fx-accent. -->
		<div class="hidden h-8 shrink-0 items-end gap-[3px] lg:flex" aria-hidden="true">
			{#each bars as bar, i (i)}
				<div class="bg-tint flex h-full w-[5px] items-end overflow-hidden rounded-t-[3px]">
					<div
						class={cn('w-full', i === bars.length - 1 ? 'bg-fx-accent' : 'bg-blue')}
						style:height={`${bar}%`}
					></div>
				</div>
			{/each}
		</div>
	</div>
	<span class={cn('truncate text-[11px] lg:text-[12px]', positive ? 'text-blue' : 'text-faint')}>
		{delta}
	</span>
</div>
