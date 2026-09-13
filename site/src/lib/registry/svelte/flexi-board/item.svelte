<script lang="ts">
	import type { FlexiWidgetController } from '@flexiboards/svelte';
	import type { ComponentProps } from 'svelte';
	import { FlexiWidget } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	let {
		class: className,
		controller = $bindable(),
		...props
	}: ComponentProps<typeof FlexiWidget> = $props();
</script>

<FlexiWidget
	{...props}
	bind:controller
	class={(widget: FlexiWidgetController) =>
		cn(
			'bg-card text-card-foreground border-border relative min-w-0 rounded-lg border shadow-sm',
			widget.isShadow && 'border-dashed opacity-50',
			widget.isGrabbed && 'ring-ring shadow-lg ring-2',
			typeof className === 'function' ? className(widget) : className
		)}
/>
