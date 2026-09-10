<script lang="ts">
	import { FlexiResize } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import MoveDiagonal2 from '@lucide/svelte/icons/move-diagonal-2';

	let { class: className, size = 16 }: { class?: string; size?: number } = $props();
</script>

<FlexiResize
	class={cn(
		'text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 rounded-md p-1.5 transition-colors',
		className
	)}
>
	<MoveDiagonal2 {size} />
</FlexiResize>
