<script lang="ts">
	import type { FlexiWidgetController } from '@flexiboards/svelte';
	import type { ComponentProps } from 'svelte';
	import { FlexiWidget } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	let {
		class: className,
		controller = $bindable(),
		id,
		metadata,
		...props
	}: ComponentProps<typeof FlexiWidget> & { id: string } = $props();
</script>

<FlexiWidget
	{...props}
	{id}
	bind:controller
	metadata={{ ...metadata, id }}
	class={(widget: FlexiWidgetController) =>
		cn(
			'bg-card text-card-foreground border-border relative flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm',
			widget.isShadow && 'border-dashed opacity-50',
			widget.isGrabbed && 'ring-ring shadow-lg ring-2',
			typeof className === 'function' ? className(widget) : className
		)}
/>
