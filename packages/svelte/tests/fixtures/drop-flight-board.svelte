<script lang="ts">
	import FlexiBoard from '../../src/components/flexi-board.svelte';
	import FlexiTarget from '../../src/components/flexi-target.svelte';
	import FlexiWidget from '../../src/components/flexi-widget.svelte';
</script>

<FlexiBoard
	config={{
		widgetDefaults: {
			draggability: 'full',
			transition: { drop: { duration: 150, easing: 'ease-out' } }
		}
	}}
>
	<FlexiTarget
		key="left"
		config={{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 3 } }}
	>
		<FlexiWidget x={0} y={0} width={1} height={1}>
			{#snippet children()}a{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
