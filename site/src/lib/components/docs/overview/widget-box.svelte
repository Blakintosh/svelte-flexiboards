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

<!-- A drawn box with a label tab: 1px rule, no radius, mono tag in the corner. -->
<div class={cn('not-prose border-rule relative border px-6 pb-6 pt-10', className)}>
	<div class={cn('label absolute -left-px -top-px px-2 py-1 text-[10px]', labelClass)}>
		&lt;{label}&gt;
	</div>
	{@render children?.()}
</div>
