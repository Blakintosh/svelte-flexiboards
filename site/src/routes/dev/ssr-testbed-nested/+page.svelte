<script lang="ts">
	/*
	  Minimal repro for the nested-board SSR duplication seen on the Notes
	  example. Board A's widget snippet contains board B; B has two targets —
	  one with bind:controller (as the kanban lists use) and one without — to
	  isolate whether the binding is what doubles the render.
	*/
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiBoardController,
		type FlexiTargetController
	} from '@flexiboards/svelte';
	import KanbanLite from './kanban-lite.svelte';

	let inner: FlexiTargetController | undefined = $state();
	let innerBoard: FlexiBoardController | undefined = $state();
</script>

<main style="padding: 2rem; font-family: monospace;">
	<h1>Nested SSR testbed</h1>
	<FlexiBoard config={{ widgetDefaults: { draggable: true } }}>
		<FlexiTarget
			key="outer"
			config={{
				rowSizing: 'minmax(0, auto)',
				layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append', rows: 2, columns: 1 }
			}}
		>
			{#snippet children()}
				<FlexiWidget>
					{#snippet children()}
						<div data-nested>
							<FlexiBoard
								config={{ widgetDefaults: { draggable: true } }}
								bind:controller={innerBoard}
							>
								<KanbanLite category="lite" items={['x1', 'x2']} />
								<FlexiTarget
									key="bound"
									bind:controller={inner}
									config={{
										rowSizing: 'minmax(0, auto)',
										layout: {
											type: 'flow',
											flowAxis: 'row',
											placementStrategy: 'append',
											rows: 3,
											columns: 1
										}
									}}
								>
									{#snippet children()}
										<FlexiWidget>{#snippet children()}bound-1{/snippet}</FlexiWidget>
										<FlexiWidget>{#snippet children()}bound-2{/snippet}</FlexiWidget>
									{/snippet}
								</FlexiTarget>
								<FlexiTarget
									key="plain"
									config={{
										rowSizing: 'minmax(0, auto)',
										layout: {
											type: 'flow',
											flowAxis: 'row',
											placementStrategy: 'append',
											rows: 3,
											columns: 1
										}
									}}
								>
									{#snippet children()}
										<FlexiWidget>{#snippet children()}plain-1{/snippet}</FlexiWidget>
										<FlexiWidget>{#snippet children()}plain-2{/snippet}</FlexiWidget>
									{/snippet}
								</FlexiTarget>
							</FlexiBoard>
						</div>
					{/snippet}
				</FlexiWidget>
			{/snippet}
		</FlexiTarget>
	</FlexiBoard>
</main>
