<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget, type FlexiWidgetController } from "svelte-flexiboards";
</script>

<div class="not-prose">
    <FlexiBoard class="flex flex-col justify-center gap-8 lg:flex-row"
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
                        "bg-muted px-4 py-2 rounded-lg w-64",
                        widget.isShadow && "opacity-50",
                        widget.isGrabbed && "animate-pulse opacity-50"
                    ];
                }
            }
        }}>
    
        <div class="bg-background border rounded-xl px-4 py-2">
            <h5 class="font-semibold text-lg mb-4">Incomplete</h5>
            <FlexiTarget key="todo" class="gap-2">
                <FlexiWidget>
                    Study for exam
                </FlexiWidget>
                <FlexiWidget>
                    Research for project
                </FlexiWidget>
            </FlexiTarget>
        </div>
    
        <div class="bg-background border rounded-xl px-4 py-2">
            <h5 class="font-semibold text-lg mb-4">Done</h5>
            <FlexiTarget key="done" class="gap-2">
                <FlexiWidget>
                    Purchase eggs
                </FlexiWidget>
                <FlexiWidget>
                    Recharge car
                </FlexiWidget>
                <FlexiWidget>
                    Feed the cat
                </FlexiWidget>
            </FlexiTarget>
        </div>
    
    </FlexiBoard>    
</div>