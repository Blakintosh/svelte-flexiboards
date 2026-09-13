<script module lang="ts">
	type ResizerProps = {
		class?: string;
		size?: number;
	};
</script>

<script lang="ts">
	import { FlexiResize } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import MoveDiagonal2 from 'lucide-svelte/icons/move-diagonal-2';

	let { class: className, size = 20 }: ResizerProps = $props();
</script>

<!-- Resizing is movement too, so the handle answers in fx-accent rather than a shadowed pill. -->
<FlexiResize
	class={cn(
		'text-faint hover:bg-tint hover:text-fx-accent active:bg-tint-accent active:text-fx-accent shrink-0 rounded-[7px] p-1.5 transition-colors duration-[120ms]',
		className
	)}
>
	<MoveDiagonal2 {size} />
</FlexiResize>
