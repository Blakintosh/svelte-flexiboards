<script lang="ts">
	import type { Snippet } from 'svelte';

	type HeadsUpProps = {
		children: Snippet;
		title?: string;
	};

	let { children, title }: HeadsUpProps = $props();
</script>

<!-- Vermillion means notice: 2px left rule, tint-accent ground, mono kicker. -->
<div class="not-prose border-fx-accent bg-tint-accent my-6 border-l-2 px-5 py-4">
	<span class="label text-fx-accent block text-[10px]">Heads up</span>
	{#if title}
		<p class="text-ink mb-0 mt-2 font-serif text-[15px] font-semibold">{title}</p>
	{/if}
	<div class="text-body mt-2 space-y-2 text-[14.5px] leading-relaxed">
		{@render children()}
	</div>
</div>
