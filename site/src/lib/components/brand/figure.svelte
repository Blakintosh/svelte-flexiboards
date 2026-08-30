<script lang="ts">
	/*
	  Every illustration is a board. Figures are captioned in a top-left ink tab:
	  `Fig n · layout · dimensions`. Placed widgets get blue frames on tint, the
	  moving widget gets a dashed fx-accent frame, empty cells get pale blue.
	*/
	import type { Snippet } from 'svelte';

	let {
		caption,
		note,
		children,
		class: className = ''
	}: { caption: string; note?: string; children: Snippet; class?: string } = $props();
</script>

<figure class="border-ink bg-panel relative m-0 border px-6 pt-9 pb-6 {className}">
	<figcaption class="label bg-ink text-paper absolute -top-px -left-px px-2 py-1 text-[10px]">
		{caption}
	</figcaption>
	{#if note}
		<div class="text-faint absolute top-3.5 right-3 font-mono text-[10px]">{note}</div>
	{/if}
	{@render children()}
</figure>
