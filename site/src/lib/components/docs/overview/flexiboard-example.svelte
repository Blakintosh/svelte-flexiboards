<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
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
				draggability: 'full',
				className: (widget: FlexiWidgetController) => {
					return [
						'w-64 border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue',
						widget.isShadow && 'opacity-50',
						// A grabbed widget is provisional: dashed fx-accent on tint-accent.
						widget.isGrabbed && 'border-dashed border-fx-accent bg-tint-accent text-fx-accent'
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
