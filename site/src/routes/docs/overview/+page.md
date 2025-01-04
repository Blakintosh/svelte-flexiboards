<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

# Overview

Hello, World!

## Anatomy of a Flexiboard

Flexiboards are constructed from a series of components, namely `FlexiBoard`, `FlexiTarget`, and `FlexiWidget`. When used together, they allow you to build drag-and-drop grids for various use cases.

Below is a diagram showing the anatomy of a Flexiboard that would be used for a todos board.
<FlexiBoardAnatomy />

Here's that board in action:

<div class="not-prose">
    <FlexiBoard class="flex h-[40vh] flex-col justify-center gap-8 lg:flex-row"
    config={{
        targetDefaults: {
            layout: {
                type: 'flow',
                flowAxis: 'row',
                placementStrategy: 'append'
            }
        },
        widgetDefaults: {
            draggable: true
        }
    }}>
    
        <div class="bg-background border rounded-xl px-4 py-2">
            <h5>Incomplete</h5>
            <FlexiTarget name="todo">
                <FlexiWidget class="bg-muted px-4 py-2 rounded-lg w-64" draggable>
                    Study for exam
                </FlexiWidget>
                <FlexiWidget class="bg-muted px-4 py-2 rounded-lg w-64" draggable>
                    Research for project
                </FlexiWidget>
            </FlexiTarget>
        </div>
    
        <div class="bg-background border rounded-xl px-4 py-2">
            <h5>Done</h5>
            <FlexiTarget name="done">
                <FlexiWidget class="bg-muted px-4 py-2 rounded-lg w-64" draggable>
                    Purchase eggs
                </FlexiWidget>
                <FlexiWidget class="bg-muted px-4 py-2 rounded-lg w-64" draggable>
                    Recharge car
                </FlexiWidget>
                <FlexiWidget class="bg-muted px-4 py-2 rounded-lg w-64" draggable>
                    Feed the cat
                </FlexiWidget>
            </FlexiTarget>
        </div>
    
    </FlexiBoard>    
</div>

In a Flexiboard, each of these components serves a specific purpose:

- `FlexiBoard` is the main container for the board, creating the drag-and-drop environment. It isolates the targets and widgets; you can have multiple boards on a single page, but widgets cannot be dragged between different FlexiBoards.
- `FlexiTarget` is a dropzone and container for widgets. You can store widgets within it in a customisable layout, and you can move widgets between different FlexiTargets of the same board.
- `FlexiWidget` is the widget itself. These can be moved, resized, and customised in a number of ways. Within a FlexiWidget, there are two main approaches to rendering content: either you can use the `children` snippet, or you can use the `component` prop to render any custom component of your choosing.
