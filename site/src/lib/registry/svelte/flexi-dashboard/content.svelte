<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	let { class: className, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	{...props}
	data-slot="dashboard-content"
	class={cn('min-h-0 flex-1 overflow-auto p-4', className)}
>
	{@render children?.()}
</div>
