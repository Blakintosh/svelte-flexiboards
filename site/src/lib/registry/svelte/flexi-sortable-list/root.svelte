<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { FlexiSortable } from '@flexiboards/svelte';
	import type { FlexiBoardConfiguration } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	let {
		class: className,
		config,
		key = 'list',
		direction = 'vertical',
		onreorder,
		controller = $bindable(),
		...props
	}: ComponentProps<typeof FlexiSortable> & { onreorder?: (ids: string[]) => void } = $props();
	const boardConfig = $derived<FlexiBoardConfiguration>({
		...config,
		onLayoutChange: (layout) => {
			config?.onLayoutChange?.(layout);
			onreorder?.(
				[...(layout[key] ?? [])]
					.sort((a, b) =>
						direction === 'vertical' ? (a.y ?? 0) - (b.y ?? 0) : (a.x ?? 0) - (b.x ?? 0)
					)
					.flatMap((entry) => (typeof entry.metadata?.id === 'string' ? [entry.metadata.id] : []))
			);
		}
	});
</script>

<FlexiSortable
	{...props}
	bind:controller
	{key}
	{direction}
	class={cn('gap-2', className)}
	config={boardConfig}
/>
