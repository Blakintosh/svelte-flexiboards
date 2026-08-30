<script module lang="ts">
	type GrabberProps = {
		class?: string;
		size?: number;
	};
</script>

<script lang="ts">
	import { FlexiGrab } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';

	let { class: className, size = 20 }: GrabberProps = $props();
</script>

<!-- Vermillion means movement: the grab handle turns accent the moment it is touched. -->
<FlexiGrab
	class={cn(
		'shrink-0 p-1.5 text-faint transition-colors duration-[120ms] hover:bg-tint hover:text-fx-accent active:bg-tint-accent active:text-fx-accent',
		className
	)}
>
	<GripVertical {size} />
</FlexiGrab>
