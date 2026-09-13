<script module lang="ts">
	import type { Snippet } from 'svelte';

	export type BreakpointSnippetParams = { currentBreakpoint: string };

	export type ResponsiveFlexiBoardProps = FlexiCommonProps<ResponsiveFlexiBoardController> & {
		/**
		 * The configuration object for the responsive board.
		 */
		config?: ResponsiveFlexiBoardConfiguration;
		/**
		 * Content rendered at the large breakpoint.
		 */
		lg?: Snippet;
		/**
		 * Content rendered at the medium breakpoint.
		 */
		md?: Snippet;
		/**
		 * Content rendered at the small breakpoint.
		 */
		sm?: Snippet;
		/**
		 * Content rendered at the extra-small breakpoint.
		 */
		xs?: Snippet;
		/**
		 * Fallback content used when no breakpoint-specific snippet matches.
		 * Receives `{ currentBreakpoint: string }`.
		 */
		children?: Snippet<[BreakpointSnippetParams]>;
	};
</script>

<script lang="ts">
	import type {
		FlexiCommonProps,
		ResponsiveFlexiBoardConfiguration,
		ResponsiveFlexiBoardController
	} from '@flexiboards/core';
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

	// Prop seam, see FlexiBoard. Inert unless `config` changed.
	$effect(() => {
		board.updateProps({ config });
	});

	// Load layouts immediately so child FlexiBoards can read them.
	board.oninitialloadcomplete();

	onfirstcreate?.(publicBoard);

	// Breakpoint name to snippet.
	const snippets: Record<string, Snippet | undefined> = $derived({
		lg,
		md,
		sm,
		xs
	});

	// The adapter owns the board's lifecycle, destroying it at unmount.
	const currentBreakpoint = $derived.by(fromCore(() => board.currentBreakpoint));
</script>

<!--
	Keyed on currentBreakpoint so the board is re-created with the right
	breakpoint context when the breakpoint changes.
-->
{#key currentBreakpoint}
	{#if snippets[currentBreakpoint]}
		{@render snippets[currentBreakpoint]!()}
	{:else if children}
		{@render children({ currentBreakpoint })}
	{/if}
{/key}
