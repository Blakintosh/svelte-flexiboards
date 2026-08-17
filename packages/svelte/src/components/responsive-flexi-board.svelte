<script module lang="ts">
	import type { Snippet } from 'svelte';

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
	import type { FlexiCommonProps, ResponsiveFlexiBoardConfiguration, ResponsiveFlexiBoardController } from '@flexiboards/core';
	import { responsiveflexiboard } from '../adapters/responsive.js';
	import { fromCore, reactive } from '../adapter.svelte.js';

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
	const publicBoard = reactive(board as ResponsiveFlexiBoardController);
	controller = publicBoard;

	// Load layouts immediately so child FlexiBoards can access them
	board.oninitialloadcomplete();

	onfirstcreate?.(publicBoard);

	// Map breakpoint names to snippets (without params)
	const snippets: Record<string, Snippet | undefined> = $derived({
		lg,
		md,
		sm,
		xs
	});

	// The adapter owns the board's lifecycle (destroy at unmount).
	const currentBreakpoint = $derived.by(fromCore(() => board.currentBreakpoint));
</script>

<!--
	Key on currentBreakpoint to force re-render when breakpoint changes.
	This ensures the board is re-created with the correct breakpoint context.
-->
{#key currentBreakpoint}
	{#if snippets[currentBreakpoint]}
		<!-- Specific breakpoint snippet (no params) -->
		{@render snippets[currentBreakpoint]!()}
	{:else if children}
		<!-- Children snippet receives { currentBreakpoint } -->
		{@render children({ currentBreakpoint })}
	{/if}
{/key}
