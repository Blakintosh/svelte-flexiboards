<script lang="ts">
	import { FlexiTarget, FlexiWidget, type FlexiTargetController } from '@flexiboards/svelte';

	let { category, items }: { category: string; items: string[] } = $props();

	let target: FlexiTargetController | undefined = $state();

	if (typeof window === 'undefined') console.log('[ssr-debug] KanbanLite init', category);
</script>

<FlexiTarget key={category} bind:controller={target}>
	{#each items as item}
		<FlexiWidget>
			{#snippet children()}<div>{item}</div>{/snippet}
		</FlexiWidget>
	{/each}
</FlexiTarget>
