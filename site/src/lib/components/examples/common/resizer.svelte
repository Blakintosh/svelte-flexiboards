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

<FlexiResize class={cn('shrink-0 py-1', className)}>
	<MoveDiagonal2 {size} />
</FlexiResize>
