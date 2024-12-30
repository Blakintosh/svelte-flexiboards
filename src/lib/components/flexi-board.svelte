<script module lang="ts">
	import { flexiboard } from '$lib/engine/provider.svelte.js';
	import { type FlexiBoardConfiguration } from '$lib/engine/types.js';
	import type { Snippet } from 'svelte';

	export type FlexiBoardProps = {
		children: Snippet;
		config?: FlexiBoardConfiguration;
		class?: string;
	};
</script>

<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	let { children, class: className, config }: FlexiBoardProps = $props();

	const provider = flexiboard(config);
</script>

<div class={twMerge('relative', className)} bind:this={provider.ref} style={provider.style}>
	{@render children()}
</div>
