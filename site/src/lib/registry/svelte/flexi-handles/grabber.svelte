<script lang="ts">
	import { FlexiGrab } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';

	let { class: className, size = 16 }: { class?: string; size?: number } = $props();
</script>

<FlexiGrab
	class={cn(
		'text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 rounded-md p-1.5 transition-colors',
		className
	)}
>
	<GripVertical {size} />
</FlexiGrab>
