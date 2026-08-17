<script lang="ts">
	import { assistiveTextStyle, flexiannouncer, type InternalFlexiBoardController } from "@flexiboards/core";
	import { fromCore } from '../adapter.svelte.js';

	type FlexiAnnouncerProps = {
		provider: InternalFlexiBoardController;
	};

	let { provider }: FlexiAnnouncerProps = $props();

	const controller = flexiannouncer(provider);

	const politeness = $derived.by(fromCore(() => controller.politeness));
	const message = $derived.by(fromCore(() => controller.message));
</script>

<div
	role="region"
	aria-live={politeness}
	aria-label="Drag-and-drop announcer"
	aria-atomic="true"
	style={assistiveTextStyle}
	id={controller.id}
>
	{message}
</div>
