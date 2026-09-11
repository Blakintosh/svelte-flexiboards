<script module lang="ts">
	import type { Snippet } from 'svelte';
	import FlexiLayoutLoader from './flexi-layout-loader.svelte';

	/**
	 * Why a board's suspense fallback is being rendered.
	 * - 'layout': a loadLayout or loadLayouts has not resolved, so the content
	 *   is provisional and the fallback shows at every viewport.
	 * - 'breakpoint': only the server's breakpoint guess (`assumed`) is
	 *   unconfirmed, so the fallback shows only where the viewport does not
	 *   match the guess, via a media query the board generates.
	 */
	export type FlexiBoardSuspenseReason =
		| { reason: 'layout' }
		| { reason: 'breakpoint'; assumed: string };

	export type FlexiBoardProps = FlexiCommonProps<FlexiBoardController> & {
		/**
		 * The child content of the board, which should contain the inner
		 * FlexiTarget and FlexiWidget components.
		 */
		children: Snippet;

		/**
		 * The configuration object for the board.
		 */
		config?: FlexiBoardConfiguration<ClassValue>;

		/**
		 * The class names to apply to the board's root element.
		 */
		class?: ClassValue;

		/**
		 * Fallback content shown while the board's server-rendered layout is
		 * provisional: a stored layout not yet imported, or an unconfirmed
		 * responsive breakpoint guess. It is server-rendered alongside the board
		 * and toggled by generated CSS, so it applies from the first paint. It
		 * unmounts once the layout is confirmed at hydration.
		 */
		suspense?: Snippet<[FlexiBoardSuspenseReason]>;
	};
</script>

<script lang="ts">
	import FlexiPortal from './flexi-portal.svelte';
	import FlexiAnnouncer from './flexi-announcer.svelte';
	import FlexiSuspenseBoundary from './flexi-suspense-boundary.svelte';
	import {
		assistiveTextStyle,
		type FlexiBoardConfiguration,
		type FlexiBoardController
	} from '@flexiboards/core';
	import type { FlexiCommonProps } from '@flexiboards/core';
	import { flexiboard } from '../adapters/board.js';
	import { fromCore, reactive, snapshotConfig } from '../adapter.svelte.js';
	import type { ClassValue } from 'svelte/elements';

	let { controller = $bindable(), onfirstcreate, ...boardProps }: FlexiBoardProps = $props();

	// The adapter owns the board's lifecycle: boardEvents at mount, destroy at
	// unmount. Config is snapshotted so core never aliases the live `$state`
	// proxy, see snapshotConfig.
	const board = flexiboard({ ...boardProps, config: snapshotConfig(boardProps.config) });
	const publicBoard = reactive(board as FlexiBoardController);
	controller = publicBoard;

	onfirstcreate?.(publicBoard);

	// $props.id() rather than generateUniqueId(), because this id is emitted into
	// the markup as aria-describedby and core's counter is process-global. On a
	// long-lived server it drifts from the client's and breaks hydration.
	const assistiveTextId = $props.id();

	// Prop seam: push config changes into core. Safe as an effect because
	// updateProps() is inert unless `config` changed, so the invalidation it
	// causes cannot feed back and re-trigger this. Reads `props` only, never
	// `publicBoard`, whose proxy reads would subscribe us to our own writes.
	// snapshotConfig() reads every nested config property, so in-place mutations
	// of a `$state` config re-run this seam too.
	$effect(() => {
		board.updateProps({ ...boardProps, config: snapshotConfig(boardProps.config) });
	});

	const style = $derived.by(fromCore(() => board.style));

	// A function call in the template, not $derived: on the server $derived
	// snapshots at init, and this must reflect the board's state at render
	// position, see FlexiTarget. One attribute with the reason in its value, so
	// stylesheets need a single hook. `data-flexi-pending="layout"` means the
	// content is provisional at every viewport. A breakpoint key such as "lg"
	// means only the breakpoint is unconfirmed, so styles can show the board
	// where the viewport matches the guess and skeleton it elsewhere.
	// Content-pending wins when both apply, and the attribute is absent once
	// nothing is provisional.
	const pending = fromCore(() =>
		board.layoutPending ? 'layout' : (board.breakpointPending ?? undefined)
	);

	// --- Suspense (framework-managed skeleton) ---------------------------------
	// The fallback must exist in the SSR HTML and through hydration, because only
	// CSS can decide whether to show it before JS runs. So it renders whenever a
	// server render would have rendered it, and unmounts after mount.
	//
	// The breakpoint case is the subtle one: `breakpointPending` is null on the
	// client from the first render, since matchMedia answers immediately, but
	// the server HTML contains the fallback. So through hydration we rebuild the
	// server's reason from the assumed breakpoint, which keeps the two trees
	// identical. onMount then drops it.
	import { onMount } from 'svelte';
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const suspenseReason = fromCore((): FlexiBoardSuspenseReason | null => {
		if (!boardProps.suspense) {
			return null;
		}
		if (board.layoutPending) {
			return { reason: 'layout' };
		}
		const serverAssumed = board.breakpointPending;
		if (serverAssumed !== null) {
			return { reason: 'breakpoint', assumed: serverAssumed };
		}
		if (!mounted) {
			const assumed = board.ssrAssumedBreakpoint;
			if (assumed !== null) {
				return { reason: 'breakpoint', assumed };
			}
		}
		return null;
	});
</script>

<div
	class={boardProps.class}
	bind:this={board.ref}
	{style}
	role="application"
	aria-label="Interactive drag-and-drop interface"
	aria-describedby={assistiveTextId}
	aria-busy={pending() ? 'true' : undefined}
	data-flexi-pending={pending()}
>
	{#snippet boardContent()}
		<span style={assistiveTextStyle} id={assistiveTextId}>
			Press Enter to grab or resize widgets. Once grabbed, use Arrow keys to move/resize the widget,
			Enter to confirm the action, or Esc to cancel it.
		</span>
		{@render boardProps.children()}

		<FlexiAnnouncer provider={board} />
	{/snippet}

	{#if boardProps.suspense}
		<FlexiSuspenseBoundary {board} reason={suspenseReason()} fallback={boardProps.suspense}>
			{@render boardContent()}
		</FlexiSuspenseBoundary>
	{:else}
		{@render boardContent()}
	{/if}
</div>

<!-- Tells the board it can start importing layouts, if needed. -->
<FlexiLayoutLoader />

<!-- Shared portal for rendering grabbed widgets over the pointer. -->
<FlexiPortal />
