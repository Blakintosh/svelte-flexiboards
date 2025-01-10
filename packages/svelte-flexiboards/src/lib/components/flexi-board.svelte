<script module lang="ts">
	import {
		flexiboard,
		type FlexiBoardConfiguration,
		type FlexiBoardController
	} from '$lib/system/provider.svelte.js';
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps, SvelteClassValue } from '$lib/system/types.js';
	import FlexiLayoutLoader from './flexi-layout-loader.svelte';

	export type FlexiBoardProps = FlexiCommonProps<FlexiBoardController> & {
		children: Snippet;
		config?: FlexiBoardConfiguration;
		class?: SvelteClassValue;
	};
</script>

<script lang="ts">
	let { controller: board = $bindable(), onfirstcreate, ...props }: FlexiBoardProps = $props();

	board = flexiboard(props);
	onfirstcreate?.(board);
</script>

<div class={props.class} bind:this={board.ref} style={board.style}>
	{@render props.children()}
</div>

<!-- Component that tells the board it can start importing stuff, if needed. -->
<FlexiLayoutLoader />
