<script lang="ts">
	import FlexiBoard from '../../src/components/flexi-board.svelte';
	import FlexiTarget from '../../src/components/flexi-target.svelte';
	import FlexiWidget from '../../src/components/flexi-widget.svelte';
	import NestedInnerBoard from './nested-inner-board.svelte';
	import type { FlexiWidgetController } from '@flexiboards/core';

	import type { FlexiBoardController } from '@flexiboards/core';

	let {
		oncard,
		onouter,
		oninner
	}: {
		oncard: (w: FlexiWidgetController) => void;
		onouter: (b: FlexiBoardController) => void;
		oninner: (b: FlexiBoardController) => void;
	} = $props();
</script>

<FlexiBoard class="outer" onfirstcreate={onouter}>
	<FlexiTarget
		key="blocks"
		config={{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } }}
	>
		<FlexiWidget x={0} y={0} width={3} height={3} component={NestedInnerBoard} componentProps={{ oncard, oninner }} />
	</FlexiTarget>
</FlexiBoard>
