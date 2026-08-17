<script lang="ts">
	/*
	  Every illustration is a board. Figures are captioned in a top-left ink tab:
	  `Fig n · layout · dimensions`. Placed widgets get blue frames on tint, the
	  moving widget gets a dashed vermillion frame, empty cells get pale blue.
	*/
	import type { Snippet } from 'svelte';

	let {
		caption,
		note,
		children,
		class: className = ''
	}: { caption: string; note?: string; children: Snippet; class?: string } = $props();
</script>

<figure class="relative m-0 border border-ink bg-panel px-6 pb-6 pt-9 {className}">
	<figcaption
		class="label absolute -left-px -top-px bg-ink px-2 py-1 text-[10px] text-paper"
	>
		{caption}
	</figcaption>
	{#if note}
		<div class="absolute right-3 top-3.5 font-mono text-[10px] text-faint">{note}</div>
	{/if}
	{@render children()}
</figure>
