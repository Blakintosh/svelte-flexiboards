<script module lang="ts">
	type GrabberProps = {
		class?: string;
		size?: number;
	};
</script>

<script lang="ts">
	import { FlexiGrab } from 'svelte-flexiboards';
	import { cn } from '$lib/utils.js';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';

	let { class: className, size = 20 }: GrabberProps = $props();
</script>

<FlexiGrab class={cn('shrink-0 rounded-md p-1.5 transition-colors hover:bg-muted active:bg-muted', className)}>
	<GripVertical {size} />
</FlexiGrab>
