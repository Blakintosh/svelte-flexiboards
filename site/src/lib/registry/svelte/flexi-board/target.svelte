<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { FlexiTarget } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	let {
		class: className,
		containerClass,
		controller = $bindable(),
		...props
	}: ComponentProps<typeof FlexiTarget> = $props();
</script>

<FlexiTarget
	{...props}
	bind:controller
	class={cn('min-h-24 gap-3', className)}
	containerClass={cn('bg-muted/40 border-border rounded-xl border p-3', containerClass)}
/>
