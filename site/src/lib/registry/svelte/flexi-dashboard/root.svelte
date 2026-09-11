<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { FlexiDashboard } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	let {
		class: className,
		targetConfig,
		resizable = true,
		controller = $bindable(),
		...props
	}: ComponentProps<typeof FlexiDashboard> = $props();
</script>

<FlexiDashboard
	{...props}
	bind:controller
	{resizable}
	class={cn('gap-4', className)}
	targetConfig={{ rowSizing: '160px', ...targetConfig }}
/>
