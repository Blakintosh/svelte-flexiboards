<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget, FlexiGrab, FlexiResize } from '../../src/index.js';
</script>

<FlexiBoard>
	<FlexiTarget
		key="main"
		config={{ layout: { type: 'free', minColumns: 4, maxColumns: 4, minRows: 4, maxRows: 4 } }}
	>
		<FlexiWidget x={0} y={0} width={2} height={2} resizability="both">
			<FlexiGrab>Move card</FlexiGrab>
			<FlexiResize>Resize card</FlexiResize>
			<input aria-label="Card title" value="Keep my edit" />
		</FlexiWidget>
		<FlexiWidget x={3} y={0} width={1} height={1}>Second card</FlexiWidget>
		<FlexiWidget x={0} y={3} width={1} height={1} draggability="movable" resizability="none">
			<FlexiGrab>Disabled move</FlexiGrab>
			<FlexiResize>Disabled resize</FlexiResize>
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
