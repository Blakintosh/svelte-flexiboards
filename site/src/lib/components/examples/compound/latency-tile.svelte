<script module lang="ts">
	export type LatencyPoint = { at: string; pct: number };

	export type LatencyTileProps = {
		value: string;
		series: LatencyPoint[];
	};
</script>

<script lang="ts">
	let { value, series }: LatencyTileProps = $props();
</script>

<div class="flex h-full min-h-0 min-w-0 flex-col gap-2">
	<span class="text-ink truncate font-serif text-xl font-semibold tracking-[-0.01em] lg:text-3xl"
		>{value}</span
	>
	<!-- A chart, unmistakably: it can never be confused with the two draggable lists beside it. -->
	<ul class="flex min-h-0 flex-1 flex-col justify-center gap-1.5">
		{#each series as point (point.at)}
			<li class="flex items-center gap-1.5">
				<span class="text-faint w-8 shrink-0 font-mono text-[9px] lg:text-[10px]">{point.at}</span>
				<span class="bg-tint h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
					<span class="bg-blue block h-full rounded-full" style:width={`${point.pct}%`}></span>
				</span>
			</li>
		{/each}
	</ul>
</div>
