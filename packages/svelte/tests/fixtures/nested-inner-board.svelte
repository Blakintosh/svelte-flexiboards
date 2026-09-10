<script lang="ts">
	import FlexiBoard from '../../src/components/flexi-board.svelte';
	import FlexiTarget from '../../src/components/flexi-target.svelte';
	import FlexiWidget from '../../src/components/flexi-widget.svelte';
	import type { FlexiWidgetController } from '@flexiboards/core';

	import { onMount } from 'svelte';

	import type { FlexiBoardController } from '@flexiboards/core';

	let {
		oncard,
		oninner
	}: { oncard: (w: FlexiWidgetController) => void; oninner: (b: FlexiBoardController) => void } =
		$props();

	// The nested board appears after the outer board has mounted (content that
	// arrives later, as on the Notes page), so it subscribes to the bus after
	// the outer board's portal has.
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
</script>

{#if ready}
<FlexiBoard
	class="inner"
	onfirstcreate={oninner}
	config={{
		widgetDefaults: { draggability: 'full', transition: { drop: { duration: 150, easing: 'ease-out' } } }
	}}
>
	<FlexiTarget
		key="cards"
		config={{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } }}
	>
		<FlexiWidget x={0} y={0} width={1} height={1} onfirstcreate={oncard}>
			{#snippet children()}card{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
{/if}
