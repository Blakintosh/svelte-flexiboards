<script lang="ts">
    import { FlexiBoard, FlexiTarget, FlexiWidget } from "svelte-flexiboards";
</script>

<div class="w-full h-full grid place-items-center justify-items-center overflow-y-auto max-h-[80vh]">

<div class="container min-w-0 relative">
    <FlexiBoard class={"border border-red-500 w-full"}>
        <FlexiTarget key="test" config={{
            layout: {
                type: "free",
                minColumns: 3,
                minRows: 12,
                maxColumns: 3
            },
            rowSizing: 'minmax(0, 1fr)',
            widgetDefaults: {
                className: 'bg-blue-700 text-white h-32'
            }
        }} class={"gap-8"}>
            <FlexiWidget x={0} y={0} width={2} height={1}>
                1
            </FlexiWidget>
            
            <FlexiWidget x={0} y={1} width={2} height={1}>
                2
            </FlexiWidget> 

            <FlexiWidget x={0} y={2} width={2} height={1}> 
                3
            </FlexiWidget>

            <FlexiWidget x={0} y={3} width={2} height={1}>
                4
            </FlexiWidget>

            <FlexiWidget x={0} y={4} width={2} height={1}>
                5
            </FlexiWidget>

            <FlexiWidget x={0} y={5} width={2} height={1}>
                6
            </FlexiWidget>
        </FlexiTarget>
    </FlexiBoard>
</div>
</div>