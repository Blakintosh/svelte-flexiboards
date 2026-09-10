<script lang="ts">
	// Six monthly readings, drawn as rounded bars: the drafting-blue ramp climbs
	// toward the latest reading, which takes the accent as the one live value.
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const points = [135, 98, 118, 104, 52, 38];
	const heights = points.map((y) => ((170 - y) / 170) * 100);

	function barClass(index: number, isLast: boolean) {
		if (isLast) return 'bg-fx-accent';
		if (index < 2) return 'bg-[var(--chart-4)]';
		if (index < 4) return 'bg-[var(--chart-3)]';
		return 'bg-[var(--chart-2)]';
	}
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="mt-2 flex min-h-16 flex-1 items-end gap-1.5 lg:gap-2">
		{#each heights as height, i (months[i])}
			<div
				class="min-w-0 flex-1 rounded-t-[8px] {barClass(i, i === heights.length - 1)}"
				style:height="{height}%"
			></div>
		{/each}
	</div>
	<div class="mt-1.5 flex justify-between">
		{#each months as month, i (month)}
			<span
				class="font-mono text-[10px] {i === months.length - 1
					? 'text-fx-accent font-semibold'
					: 'text-faint'}">{month}</span
			>
		{/each}
	</div>
</div>
