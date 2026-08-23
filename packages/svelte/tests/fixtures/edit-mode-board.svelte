<script lang="ts">
	import FlexiBoard from '../../src/components/flexi-board.svelte';
	import FlexiTarget from '../../src/components/flexi-target.svelte';
	import FlexiWidget from '../../src/components/flexi-widget.svelte';
	import FlexiGrab from '../../src/components/flexi-grab.svelte';
	import type { FlexiBoardConfiguration } from '@flexiboards/core';
	import type { ClassValue } from 'svelte/elements';

	// Mirrors the dashboard example: a stable $state config whose widgetDefaults
	// is reassigned when edit mode toggles.
	let editMode = $state(false);

	let config: FlexiBoardConfiguration<ClassValue> = $state({
		widgetDefaults: { draggability: 'none', resizability: 'none' }
	});

	export function toggleEditMode() {
		editMode = !editMode;
		config.widgetDefaults = {
			draggability: editMode ? 'full' : 'none',
			resizability: editMode ? 'horizontal' : 'none'
		};
	}
</script>

<FlexiBoard {config}>
	<FlexiTarget
		key="left"
		config={{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } }}
	>
		<FlexiWidget x={0} y={0} width={1} height={1}>
			{#snippet children()}
				<FlexiGrab>
					{#snippet children()}grab{/snippet}
				</FlexiGrab>
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
