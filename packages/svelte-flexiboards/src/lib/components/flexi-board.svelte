<script module lang="ts">
	import { flexiboard } from '$lib/system/board/index.js';
	import type { FlexiBoardController } from '$lib/system/board/base.svelte.js';
	import type { FlexiBoardConfiguration } from '$lib/system/board/types.js';
	import { onDestroy, type Snippet } from 'svelte';
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import FlexiLayoutLoader from './flexi-layout-loader.svelte';

	export type FlexiBoardProps = FlexiCommonProps<FlexiBoardController> & {
		children: Snippet;
		config?: FlexiBoardConfiguration;
		class?: ClassValue;
	};
</script>

<script lang="ts">
	import FlexiPortal from './flexi-portal.svelte';
	import type { ClassValue } from 'svelte/elements';
	import { generateUniqueId, assistiveTextStyle } from '$lib/system/shared/utils.svelte.js';
	import FlexiAnnouncer from './flexi-announcer.svelte';

	let { controller = $bindable(), onfirstcreate, ...props }: FlexiBoardProps = $props();

	const board = flexiboard(props);
	controller = board;

	onfirstcreate?.(board);

	let assistiveTextId = generateUniqueId();

	// Cleanup board subscriptions when component is destroyed
	onDestroy(() => {
		board.destroy();
	});
</script>

<div
	class={props.class}
	bind:this={board.ref}
	style={board.style}
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
