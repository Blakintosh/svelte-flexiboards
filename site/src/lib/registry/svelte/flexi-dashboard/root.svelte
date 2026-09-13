<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { FlexiDashboard } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import { reducedMotion, withMotion } from '../flexi-motion/index.js';
	let {
		class: className,
		config,
		targetConfig,
		resizable = true,
		controller = $bindable(),
		...props
	}: ComponentProps<typeof FlexiDashboard> = $props();
	const motionConfig = $derived(withMotion(config, reducedMotion.current));
</script>

<FlexiDashboard
	{...props}
	bind:controller
	config={motionConfig}
	{resizable}
	class={cn('gap-4', className)}
	targetConfig={{ rowSizing: '160px', ...targetConfig }}
/>
