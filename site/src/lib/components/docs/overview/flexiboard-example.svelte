<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiWidgetController
	} from 'svelte-flexiboards';
</script>

<div class="not-prose">
	<FlexiBoard
		class="flex flex-col justify-center gap-8 lg:flex-row"
		config={{
			targetDefaults: {
				layout: {
					type: 'flow',
					flowAxis: 'row',
					placementStrategy: 'append'
				}
			},
			widgetDefaults: {
				draggable: true,
				className: (widget: FlexiWidgetController) => {
					return [
						'w-64 border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue',
						widget.isShadow && 'opacity-50',
						// A grabbed widget is provisional: dashed vermillion on tint-accent.
						widget.isGrabbed && 'border-dashed border-vermillion bg-tint-accent text-vermillion'
					];
				}
			}
		}}
	>
		<div class="border border-rule bg-panel px-4 py-3">
			<h5 class="label mb-4 text-[10px] text-faint">Incomplete</h5>
			<FlexiTarget key="todo" class="gap-2">
				<FlexiWidget>Study for exam</FlexiWidget>
				<FlexiWidget>Research for project</FlexiWidget>
			</FlexiTarget>
		</div>

		<div class="border border-rule bg-panel px-4 py-3">
			<h5 class="label mb-4 text-[10px] text-faint">Done</h5>
			<FlexiTarget key="done" class="gap-2">
				<FlexiWidget>Purchase eggs</FlexiWidget>
				<FlexiWidget>Recharge car</FlexiWidget>
				<FlexiWidget>Feed the cat</FlexiWidget>
			</FlexiTarget>
		</div>
	</FlexiBoard>
</div>
