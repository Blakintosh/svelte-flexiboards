<script module lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Static app-sidebar shell for the app-concept examples (dashboard, notes).
	 * Replaces the shadcn sidebar: no collapse, no mobile drawer — the demo is
	 * the board, not the nav — so it simply hides below lg.
	 */
	type SidebarProps = {
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		class?: string;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { header, children, footer, class: className }: SidebarProps = $props();
</script>

<aside class={cn('border-rule-soft bg-paper hidden w-64 shrink-0 flex-col border-r lg:flex', className)}>
	{#if header}
		<div class="border-rule-soft border-b px-2 py-4">{@render header()}</div>
	{/if}
	<nav class="flex flex-1 flex-col gap-1 px-2 py-4">{@render children?.()}</nav>
	{#if footer}
		<div class="border-rule-soft border-t p-2">{@render footer()}</div>
	{/if}
</aside>
