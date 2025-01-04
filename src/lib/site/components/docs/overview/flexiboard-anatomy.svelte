<script>
	import WidgetBox from './widget-box.svelte';
</script>

<WidgetBox
	label="FlexiBoard"
	class={'flex flex-col items-center gap-16 border-purple-700 text-base text-white lg:flex-row'}
	labelClass={'bg-purple-700'}
>
	<WidgetBox label="FlexiTarget" class={'border-blue-700'} labelClass={'bg-blue-700 text-white'}>
		<WidgetBox
			label="FlexiWidget"
			class={'border-green-700'}
			labelClass={'bg-green-700 text-white'}
		>
			<div class="bg-orange-700 px-4 py-2">Snippet | Component</div>
		</WidgetBox>
	</WidgetBox>

	<WidgetBox label="FlexiTarget" class={'border-blue-700'} labelClass={'bg-blue-700 text-white'}>
		<WidgetBox
			label="FlexiWidget"
			class={'flex flex-col border-green-700'}
			labelClass={'bg-green-700 text-white'}
		>
			<div class="bg-orange-700 px-4 py-2">Snippet | Component</div>
		</WidgetBox>
		<WidgetBox
			label="FlexiWidget"
			class={'flex flex-col border-green-700'}
			labelClass={'bg-green-700 text-white'}
		>
			<div class="bg-orange-700 px-4 py-2">Snippet | Component</div>
		</WidgetBox>
	</WidgetBox>
</WidgetBox>
