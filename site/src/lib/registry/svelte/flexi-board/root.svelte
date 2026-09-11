<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { FlexiBoard } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	let {
		class: className,
		config,
		controller = $bindable(),
		...props
	}: ComponentProps<typeof FlexiBoard> = $props();
</script>

<FlexiBoard
	{...props}
	bind:controller
	class={cn('text-foreground', className)}
	config={{ ...config, widgetDefaults: { draggability: 'full', ...config?.widgetDefaults } }}
/>
