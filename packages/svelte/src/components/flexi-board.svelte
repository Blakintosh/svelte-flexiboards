<script module lang="ts">
	import type { Snippet } from 'svelte';
	import FlexiLayoutLoader from './flexi-layout-loader.svelte';

	export type FlexiBoardProps = FlexiCommonProps<FlexiBoardController> & {
		children: Snippet;
		config?: FlexiBoardConfiguration;
		class?: ClassValue;
	};
</script>

<script lang="ts">
	import FlexiPortal from './flexi-portal.svelte';
	import FlexiAnnouncer from './flexi-announcer.svelte';
	import { assistiveTextStyle, generateUniqueId, type FlexiBoardConfiguration, type FlexiBoardController } from '@flexiboards/core';
	import type { ClassValue, FlexiCommonProps } from '@flexiboards/core';
	import { flexiboard } from '../adapters/board.js';
	import { fromCore, reactive } from '../adapter.svelte.js';

	let { controller = $bindable(), onfirstcreate, ...props }: FlexiBoardProps = $props();

	// The adapter owns the board's lifecycle (boardEvents at mount, destroy at unmount).
	const board = flexiboard(props);
	const publicBoard = reactive(board as FlexiBoardController);
	controller = publicBoard;

	onfirstcreate?.(publicBoard);

	let assistiveTextId = generateUniqueId();

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
