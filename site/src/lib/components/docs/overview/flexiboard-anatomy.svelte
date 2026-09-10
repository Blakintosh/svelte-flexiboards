<script lang="ts">
	import Figure from '$lib/components/brand/figure.svelte';
	import WidgetBox from './widget-box.svelte';

	/*
	  The nesting reads through the box grounds: the board is an ink frame, targets
	  are pale cells, widgets take the blue-on-tint frame every placed widget uses.
	*/
	const targetClass = 'border-rule bg-tint-2';
	const targetLabelClass = 'bg-blue text-white';
	const widgetClass = 'border-blue bg-tint';
	const widgetLabelClass = 'bg-tint text-blue';
</script>

<Figure caption="Fig 1 · component anatomy" note="board › target › widget">
	<!-- `mt-3` keeps the board's own tab clear of the figure caption above it, so
	     the two read as nested tiers rather than one collided label. -->
	<WidgetBox
		label="FlexiBoard"
		class="border-ink bg-paper mt-3 flex flex-col items-stretch gap-10 lg:flex-row"
		labelClass="bg-ink text-paper"
	>
		<WidgetBox label="FlexiTarget" class={targetClass} labelClass={targetLabelClass}>
			<WidgetBox label="FlexiWidget" class={widgetClass} labelClass={widgetLabelClass}>
				<div class="border-rule bg-panel text-body border px-4 py-2 font-mono text-[12px]">
					Snippet | Component
				</div>
			</WidgetBox>
		</WidgetBox>

		<WidgetBox
			label="FlexiTarget"
			class="flex flex-col gap-6 {targetClass}"
			labelClass={targetLabelClass}
		>
			<WidgetBox label="FlexiWidget" class={widgetClass} labelClass={widgetLabelClass}>
				<div class="border-rule bg-panel text-body border px-4 py-2 font-mono text-[12px]">
					Snippet | Component
				</div>
			</WidgetBox>
			<WidgetBox label="FlexiWidget" class={widgetClass} labelClass={widgetLabelClass}>
				<div class="border-rule bg-panel text-body border px-4 py-2 font-mono text-[12px]">
					Snippet | Component
				</div>
			</WidgetBox>
		</WidgetBox>
	</WidgetBox>
</Figure>
