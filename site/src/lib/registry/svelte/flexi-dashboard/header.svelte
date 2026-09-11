<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';
	let { class: className, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	{...props}
	data-slot="dashboard-header"
	class={cn('flex items-center justify-between gap-3 px-4 pt-4', className)}
>
	{@render children?.()}
</div>
