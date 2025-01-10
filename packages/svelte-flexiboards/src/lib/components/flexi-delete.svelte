<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps, SvelteClassValue } from '$lib/system/types.js';
	import { flexidelete } from '$lib/system/manage.svelte.js';

	export type FlexiDeleteProps = {
		children?: Snippet;
		class?: SvelteClassValue;
	};
</script>

<script lang="ts">
	let { children, class: className }: FlexiDeleteProps = $props();

	const { onpointerenter, onpointerleave } = flexidelete();
</script>

<div class={className} {onpointerenter} {onpointerleave}>
	{@render children?.()}
</div>
