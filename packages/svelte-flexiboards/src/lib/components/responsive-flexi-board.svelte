<script module lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import type { ResponsiveFlexiBoardController } from '$lib/system/responsive/base.svelte.js';
	import type { ResponsiveFlexiBoardConfiguration } from '$lib/system/responsive/types.js';

	export type BreakpointSnippetParams = { currentBreakpoint: string };

	export type ResponsiveFlexiBoardProps = FlexiCommonProps<ResponsiveFlexiBoardController> & {
		config?: ResponsiveFlexiBoardConfiguration;
		/**
		 * Snippet for large breakpoint (no params - breakpoint is implicit).
		 */
		lg?: Snippet;
		/**
		 * Snippet for medium breakpoint (no params - breakpoint is implicit).
		 */
		md?: Snippet;
		/**
		 * Snippet for small breakpoint (no params - breakpoint is implicit).
		 */
		sm?: Snippet;
		/**
		 * Snippet for extra-small breakpoint (no params - breakpoint is implicit).
		 */
		xs?: Snippet;
		/**
		 * Children snippet used as fallback when no specific breakpoint snippet matches.
		 * Receives `{ currentBreakpoint: string }` as a parameter.
		 */
		children?: Snippet<[BreakpointSnippetParams]>;
	};
</script>

<script lang="ts">
	import { responsiveflexiboard } from '$lib/system/responsive/index.js';

	let {
		controller = $bindable(),
		onfirstcreate,
		config,
		lg,
		md,
		sm,
		xs,
		children
	}: ResponsiveFlexiBoardProps = $props();

	const board = responsiveflexiboard({ config });
	controller = board;

	// Load layouts immediately so child FlexiBoards can access them
	board.oninitialloadcomplete();

	onfirstcreate?.(board);

	// Map breakpoint names to snippets (without params)
	const snippets: Record<string, Snippet | undefined> = $derived({
		lg,
		md,
		sm,
		xs
	});

	// Cleanup when component is destroyed
	onDestroy(() => {
		board.destroy();
	});
</script>

<!--
	Key on currentBreakpoint to force re-render when breakpoint changes.
	This ensures the board is re-created with the correct breakpoint context.
-->
{#key board.currentBreakpoint}
	{#if snippets[board.currentBreakpoint]}
		<!-- Specific breakpoint snippet (no params) -->
		{@render snippets[board.currentBreakpoint]!()}
	{:else if children}
		<!-- Children snippet receives { currentBreakpoint } -->
		{@render children({ currentBreakpoint: board.currentBreakpoint })}
	{/if}
{/key}
