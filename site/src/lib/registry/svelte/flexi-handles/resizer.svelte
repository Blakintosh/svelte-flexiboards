<script lang="ts">
	import type { FlexiWidgetClasses } from '@flexiboards/svelte';
	import type { ComponentProps } from 'svelte';
	import { getFlexiwidgetCtx, FlexiResize } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import MoveDiagonal2 from '@lucide/svelte/icons/move-diagonal-2';
	let {
		class: className,
		children: content,
		size = 16,
		label = 'Resize widget'
	}: Omit<ComponentProps<typeof FlexiResize>, 'class'> & {
		class?: FlexiWidgetClasses;
		size?: number;
		label?: string;
	} = $props();
	const widget = getFlexiwidgetCtx();
</script>

<FlexiResize
	class={cn(
		'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring ring-offset-background inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
		typeof className === 'function' ? className(widget) : className
	)}
>
	{#snippet children(context)}
		<span class="sr-only">{label}</span>
		{#if content}{@render content(context)}{:else}<MoveDiagonal2 {size} aria-hidden="true" />{/if}
	{/snippet}
</FlexiResize>
