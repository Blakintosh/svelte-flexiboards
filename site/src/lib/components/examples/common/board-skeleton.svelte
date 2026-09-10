<script module lang="ts">
	/**
	 * Suspense fallback shared by the examples whose boards load client-side
	 * (stored layouts) or serve a guessed breakpoint: soft rounded bars in the
	 * rough shape of the board that's coming. Static by design — the site's
	 * one permitted motion loop is the terminal caret.
	 */
	type BoardSkeletonProps = {
		/** Number of skeleton bars. */
		bars?: number;
		/** Tailwind height class per bar. */
		barClass?: string;
		class?: string;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { bars = 3, barClass = 'h-11', class: className }: BoardSkeletonProps = $props();
</script>

<div class={cn('flex w-full flex-col gap-3 py-1', className)} role="presentation">
	{#each { length: bars } as _, i (i)}
		<div class={cn('bg-ink/10 w-full rounded-[10px]', barClass, i === bars - 1 && 'w-3/5')}></div>
	{/each}
</div>
