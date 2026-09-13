<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { FlexiBoard } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import { reducedMotion, withMotion } from '../flexi-motion/index.js';
	let {
		class: className,
		config,
		controller = $bindable(),
		...props
	}: ComponentProps<typeof FlexiBoard> = $props();
	const motionConfig = $derived(withMotion(config, reducedMotion.current));
</script>

<FlexiBoard
	{...props}
	bind:controller
	class={cn('text-foreground', className)}
	config={{
		...motionConfig,
		widgetDefaults: { draggability: 'full', ...motionConfig.widgetDefaults }
	}}
/>
