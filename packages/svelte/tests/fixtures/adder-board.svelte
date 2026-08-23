<script lang="ts">
	import FlexiBoard from '../../src/components/flexi-board.svelte';
	import FlexiTarget from '../../src/components/flexi-target.svelte';
	import FlexiAdd from '../../src/components/flexi-add.svelte';
	import type { AdderWidgetConfiguration } from '@flexiboards/core';

	function addWidget(): AdderWidgetConfiguration {
		return { widget: { width: 1, height: 1 } };
	}
</script>

<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
	<FlexiAdd {addWidget} class="adder">
		{#snippet children()}add{/snippet}
	</FlexiAdd>
	<FlexiTarget
		key="left"
		config={{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } }}
	/>
</FlexiBoard>
