<script module lang="ts">
	type ResizerProps = {
		class?: string;
		size?: number;
	};
</script>

<script lang="ts">
	import { FlexiResize } from 'svelte-flexiboards';
	import { cn } from '$lib/utils.js';
	import MoveDiagonal2 from 'lucide-svelte/icons/move-diagonal-2';

	let { class: className, size = 20 }: ResizerProps = $props();
</script>

<!-- Resizing is movement too, so the handle answers in vermillion rather than a shadowed pill. -->
<FlexiResize
	class={cn(
		'shrink-0 p-1.5 text-faint transition-colors duration-[120ms] hover:bg-tint hover:text-vermillion active:bg-tint-accent active:text-vermillion',
		className
	)}
>
	<MoveDiagonal2 {size} />
</FlexiResize>
