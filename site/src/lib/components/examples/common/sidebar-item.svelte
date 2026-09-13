<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type SidebarItemProps = HTMLButtonAttributes & {
		active?: boolean;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { active = false, class: className, children, ...rest }: SidebarItemProps = $props();
</script>

<button
	type="button"
	aria-current={active ? 'page' : undefined}
	class={cn(
		'flex w-full items-center gap-2 rounded-[9px] px-2.5 py-[7px] text-[13px] transition-colors duration-[120ms]',
		active ? 'bg-tint text-ink font-bold' : 'text-body hover:bg-tint hover:text-ink',
		className
	)}
	{...rest}
>
	{@render children?.()}
</button>
