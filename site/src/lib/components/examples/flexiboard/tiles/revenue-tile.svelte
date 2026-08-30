<script lang="ts">
	// Six monthly readings, drawn straight as an SVG plate rather than a chart
	// library: the sheet wants hairlines and a single marked endpoint, not axes.
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const points = [135, 98, 118, 104, 52, 38];
	const line = points.map((y, i) => `${(i / (points.length - 1)) * 600},${y}`).join(' ');
	// The plot is stretched to the plate, so the endpoint marker is drawn in HTML
	// instead of SVG — a circle in a non-uniform viewBox would come out an ellipse.
	const endTop = (points[points.length - 1] / 170) * 100;
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="relative mt-2 min-h-16 flex-1">
		<svg viewBox="0 0 600 170" preserveAspectRatio="none" class="h-full w-full">
			<polygon points="{line} 600,170 0,170" class="fill-blue opacity-20" />
			<polyline
				points={line}
				fill="none"
				stroke-width="2.5"
				vector-effect="non-scaling-stroke"
				class="stroke-blue"
			/>
		</svg>
		<!-- The latest reading is the live one, so it takes the accent. -->
		<span
			class="bg-fx-accent absolute right-0 block size-2 -translate-y-1/2"
			style="top: {endTop}%"
		></span>
	</div>
	<div class="mt-1.5 flex justify-between">
		{#each months as month, i (month)}
			<span
				class="font-mono text-[10px] {i === months.length - 1 ? 'text-fx-accent' : 'text-faint'}"
				>{month}</span
			>
		{/each}
	</div>
</div>
