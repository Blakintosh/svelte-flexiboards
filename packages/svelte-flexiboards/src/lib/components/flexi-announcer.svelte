<script lang="ts">
	import { flexiannouncer } from '$lib/system/announcer.svelte.js';
	import type { InternalFlexiBoardController } from '$lib/system/board/controller.svelte.js';
	import { assistiveTextStyle } from '$lib/system/shared/utils.svelte.js';

	type FlexiAnnouncerProps = {
		provider: InternalFlexiBoardController;
	};

	let { provider }: FlexiAnnouncerProps = $props();

	const controller = flexiannouncer(provider);
</script>

<div
	role="region"
	aria-live={controller.politeness}
	aria-label="Drag-and-drop announcer"
	aria-atomic="true"
	style={assistiveTextStyle}
	id={controller.id}
>
	{controller.message}
</div>
