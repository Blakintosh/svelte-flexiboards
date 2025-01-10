<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps, SvelteClassValue } from '$lib/system/types.js';
	import { flexidelete } from '$lib/system/manage.svelte.js';

	type FlexiDeleteChildrenProps = {
		onpointerenter: (event: PointerEvent) => void;
		onpointerleave: (event: PointerEvent) => void;
	};

	export type FlexiDeleteProps = {
		children?: Snippet<[{ props: FlexiDeleteChildrenProps }]>;
	};
</script>

<script lang="ts">
	let { children }: FlexiDeleteProps = $props();

	const { onpointerenter, onpointerleave } = flexidelete();
</script>

{@render children?.({ props: { onpointerenter, onpointerleave } })}
