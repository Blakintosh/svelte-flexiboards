<script module lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	type WidgetBoxProps = {
		label: string;
		class?: string;
		labelClass?: string;
		children?: Snippet;
	};
</script>

<script lang="ts">
	let { label, class: className, labelClass, children }: WidgetBoxProps = $props();
</script>

<div class={cn('not-prose relative border px-8 py-12', className)}>
	<div class={cn('absolute left-0 top-0 px-2 py-1 text-base', labelClass)}>
		&lt;{label}&gt;
	</div>
	{@render children?.()}
</div>
