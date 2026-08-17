<script lang="ts">
	import type { Snippet } from 'svelte';

	type HeadsUpProps = {
		children: Snippet;
		title?: string;
	};

	let { children, title }: HeadsUpProps = $props();
</script>

<!-- Vermillion means notice: 2px left rule, tint-accent ground, mono kicker. -->
<div class="not-prose my-6 border-l-2 border-vermillion bg-tint-accent px-5 py-4">
	<span class="label block text-[10px] text-vermillion">Heads up</span>
	{#if title}
		<p class="mb-0 mt-2 font-serif text-[15px] font-semibold text-ink">{title}</p>
	{/if}
	<div class="mt-2 space-y-2 text-[14.5px] leading-relaxed text-body">
		{@render children()}
	</div>
</div>
