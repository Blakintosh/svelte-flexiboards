<script lang="ts">
	/* Section numbers are labels, always to the right of the heading. */
	import type { Snippet } from 'svelte';

	let {
		number,
		level = 2,
		children,
		class: className = ''
	}: { number?: string; level?: 2 | 3; children: Snippet; class?: string } = $props();
</script>

<div class="flex flex-wrap items-baseline gap-4 {className}">
	<svelte:element
		this={`h${level}`}
		class="m-0 font-serif {level === 2 ? 'text-[30px]' : 'text-[19px]'}"
	>
		{@render children()}
	</svelte:element>
	{#if number}
		<span class="label text-faint text-[11px]">§ {number}</span>
	{/if}
</div>
