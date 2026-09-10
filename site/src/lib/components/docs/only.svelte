<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { Framework } from '$lib/components/brand/framework.svelte';

	/**
	 * Gates a run of docs content to one framework. Renders nothing for the
	 * other, so headings inside drop out of the table of contents too. The
	 * framework is known on the server (cookie), so gated content SSRs.
	 *
	 *   <Only svelte> …svelte-only markdown… </Only>
	 *   <Only react> …react-only markdown… </Only>
	 */
	type OnlyProps = { svelte?: boolean; react?: boolean; children: Snippet };
</script>

<script lang="ts">
	import { framework } from '$lib/components/brand/framework.svelte';

	let { svelte = false, react = false, children }: OnlyProps = $props();

	const wanted: Framework[] = $derived([
		...(svelte ? (['svelte'] as const) : []),
		...(react ? (['react'] as const) : [])
	]);
	const show = $derived(wanted.includes(framework.current));
</script>

{#if show}
	{@render children()}
{/if}
