<script module lang="ts">
	import {
		FlexiBoard,
		flexiboard,
		type FlexiBoardConfiguration
	} from '$lib/system/provider.svelte.js';
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import FlexiLayoutLoader from './flexi-layout-loader.svelte';

	export type FlexiBoardProps = FlexiCommonProps<FlexiBoard> & {
		children: Snippet;
		config?: FlexiBoardConfiguration;
		class?: string;
	};
</script>

<script lang="ts">
	let { this: board = $bindable(), onfirstcreate, ...props }: FlexiBoardProps = $props();

	board = flexiboard(props);
	onfirstcreate?.(board);

	// TODO: Clean this up
	let test = props.config;

	$inspect('is original config draggable?', test?.widgetDefaults?.draggable);

	$inspect('is config draggable?', props.config?.widgetDefaults?.draggable);
	$inspect('is provider draggable?', board.config?.widgetDefaults?.draggable);
</script>

<div class={props.class} bind:this={board.ref} style={board.style}>
	{@render props.children()}
</div>

<FlexiLayoutLoader />
