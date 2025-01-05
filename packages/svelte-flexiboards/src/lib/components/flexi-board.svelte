<script module lang="ts">
	import { flexiboard, type FlexiBoardConfiguration } from '$lib/system/provider.svelte.js';
	import type { Snippet } from 'svelte';

	export type FlexiBoardProps = {
		children: Snippet;
		config?: FlexiBoardConfiguration;
		class?: string;
	};
</script>

<script lang="ts">
	let props: FlexiBoardProps = $props();

	const provider = flexiboard(props);

	let test = props.config;

	$inspect('is original config draggable?', test?.widgetDefaults?.draggable);

	$inspect('is config draggable?', props.config?.widgetDefaults?.draggable);
	$inspect('is provider draggable?', provider.config?.widgetDefaults?.draggable);
</script>

<div class={props.class} bind:this={provider.ref} style={provider.style}>
	{@render props.children()}
</div>
