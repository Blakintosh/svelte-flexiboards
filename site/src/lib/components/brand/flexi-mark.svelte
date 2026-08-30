<script lang="ts">
	/*
	  The mark: three stacked bars of decreasing width. Bars 1-2 in ink, bar 3 in
	  fx-accent — the widget that just moved. Bar height equals the gap x 2;
	  widths step 26/17/9 at large size, 18/12/6 in nav. The fx-accent bar never
	  inverts, so `inverted` only flips the first two to paper.
	*/
	type Size = 'nav' | 'lg';

	let {
		size = 'nav',
		inverted = false,
		class: className = ''
	}: { size?: Size; inverted?: boolean; class?: string } = $props();

	const geometry = {
		nav: { height: 4, gap: 2, widths: [18, 12, 6] },
		lg: { height: 6, gap: 3, widths: [26, 17, 9] }
	} satisfies Record<Size, { height: number; gap: number; widths: number[] }>;

	const g = $derived(geometry[size]);
</script>

<div class="flex flex-col items-start {className}" style="gap:{g.gap}px" aria-hidden="true">
	{#each g.widths as width, i (i)}
		<div
			class={i === 2 ? 'bg-fx-accent' : inverted ? 'bg-paper' : 'bg-ink'}
			style="height:{g.height}px; width:{width}px"
		></div>
	{/each}
</div>
