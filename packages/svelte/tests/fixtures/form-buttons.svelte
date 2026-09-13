<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		FlexiAdd,
		FlexiGrab,
		FlexiResize
	} from '../../src/index.js';
</script>

<form>
	<FlexiBoard>
		<FlexiAdd addWidget={() => null}>add</FlexiAdd>
		<FlexiTarget key="main">
			<FlexiWidget resizability="both"
				><FlexiGrab>grab</FlexiGrab><FlexiResize>resize</FlexiResize></FlexiWidget
			>
		</FlexiTarget>
	</FlexiBoard>
</form>
