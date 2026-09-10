<script module lang="ts">
	import type { Icon } from 'lucide-svelte';
	import { FlexiWidget, type FlexiWidgetProps } from '@flexiboards/svelte';
	import TileContents from './tile-contents.svelte';

	export type TileProps = FlexiWidgetProps & {
		title: string;
		on: boolean;
		onIcon?: typeof Icon;
		offIcon?: typeof Icon;
	};
</script>

<script lang="ts">
	let { title, on = $bindable(), onIcon: OnIcon, offIcon: OffIcon, ...props }: TileProps = $props();
</script>

<FlexiWidget
	{...props}
	draggability={'none'}
	resizability={'none'}
	maxWidth={2}
	maxHeight={1}
	component={TileContents}
	componentProps={{
		title,
		on,
		onIcon: OnIcon,
		offIcon: OffIcon
	}}
/>
