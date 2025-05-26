<script module lang="ts">
	import {
		flexiboard,
		type FlexiBoardConfiguration,
		type FlexiBoardController
	} from '$lib/system/provider.svelte.js';
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import FlexiLayoutLoader from './flexi-layout-loader.svelte';

	export type FlexiBoardProps = FlexiCommonProps<FlexiBoardController> & {
		children: Snippet;
		config?: FlexiBoardConfiguration;
		class?: ClassValue;
	};
</script>

<script lang="ts">
	import FlexiPortal from './flexi-portal.svelte';
	import type { ClassValue } from 'svelte/elements';

	let { controller: board = $bindable(), onfirstcreate, ...props }: FlexiBoardProps = $props();

	board = flexiboard(props);
	onfirstcreate?.(board);
</script>

<div class={props.class} bind:this={board.ref} style={board.style}>
	{@render props.children()}
</div>

<!-- Component that tells the board it can start importing stuff, if needed. -->
<FlexiLayoutLoader />

<!-- Component that uses a shared portal for rendering grabbed widgets over the pointer. -->
<FlexiPortal />
