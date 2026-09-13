<script lang="ts">
	import { framework } from '$lib/components/brand/framework.svelte';

	/** Inline alternatives for shared prose and table cells; use Only for whole sections. */
	let { svelte, react, code = false }: { svelte: string; react: string; code?: boolean } = $props();
	const text = $derived(framework.current === 'react' ? react : svelte);
</script>

{#if code}<code>{text}</code>{:else}{text}{/if}
