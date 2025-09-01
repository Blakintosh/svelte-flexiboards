<script module lang="ts">
	import { untrack, type Component, type Snippet } from "svelte";
    import { FlexiResize, FlexiWidget, type FlexiWidgetProps } from "svelte-flexiboards";
	import { getFlexspressiveEditor } from "./index.svelte";
	import TileContents from "./tile-contents.svelte";

    export type TileProps = FlexiWidgetProps & {
        title: string;
        on: boolean;
        onIcon?: any;
        offIcon?: any;
    };
</script>

<script lang="ts">
    let { title, on = $bindable(), onIcon: Icon, offIcon: OffIcon, ...props }: TileProps = $props();
</script>

<FlexiWidget {...props} 
    draggable={false} 
    resizability={'none'} 
    component={TileContents}
    componentProps={{
        title,
        on,
        onIcon: Icon,
        offIcon: OffIcon
    }}
/>