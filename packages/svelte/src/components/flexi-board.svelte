<script module lang="ts">
	import type { Snippet } from 'svelte';
	import FlexiLayoutLoader from './flexi-layout-loader.svelte';

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
	};
</script>

<script lang="ts">
	import FlexiPortal from './flexi-portal.svelte';
	import FlexiAnnouncer from './flexi-announcer.svelte';
	import { assistiveTextStyle, generateUniqueId, type FlexiBoardConfiguration, type FlexiBoardController } from '@flexiboards/core';
	import type { FlexiCommonProps } from '@flexiboards/core';
	import { flexiboard } from '../adapters/board.js';
	import { fromCore, reactive, snapshotConfig } from '../adapter.svelte.js';
	import type { ClassValue } from 'svelte/elements';

	let { controller = $bindable(), onfirstcreate, ...props }: FlexiBoardProps = $props();

	// The adapter owns the board's lifecycle (boardEvents at mount, destroy at unmount).
	// Config is snapshotted so core never aliases the live `$state` proxy (see snapshotConfig).
	const board = flexiboard({ ...props, config: snapshotConfig(props.config) });
	const publicBoard = reactive(board as FlexiBoardController);
	controller = publicBoard;

	onfirstcreate?.(publicBoard);

	let assistiveTextId = generateUniqueId();

	// Prop seam: push config changes into core. Safe to run as an effect because
	// updateProps() is inert unless `config` actually changed, so the invalidation
	// it causes can't feed back in and re-trigger this. Reads `props` only — never
	// `publicBoard`, whose proxy reads would subscribe us to our own writes.
	// snapshotConfig() reads every nested config property, so in-place mutations
	// of a `$state` config re-run this seam as well as wholesale replacement.
	$effect(() => {
		board.updateProps({ ...props, config: snapshotConfig(props.config) });
	});

	const style = $derived.by(fromCore(() => board.style));
</script>

<div
	class={props.class}
	bind:this={board.ref}
	{style}
	role="application"
	aria-label="Interactive drag-and-drop interface"
	aria-describedby={assistiveTextId}
>
	<span style={assistiveTextStyle} id={assistiveTextId}>
		Press Enter to grab or resize widgets. Once grabbed, use Arrow keys to move/resize the widget,
		Enter to confirm the action, or Esc to cancel it.
	</span>
	{@render props.children()}

	<FlexiAnnouncer provider={board} />
</div>

<!-- Component that tells the board it can start importing stuff, if needed. -->
<FlexiLayoutLoader />

<!-- Component that uses a shared portal for rendering grabbed widgets over the pointer. -->
<FlexiPortal />
