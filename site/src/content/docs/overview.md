---
title: Overview
description: Learn what a Flexiboard is and how to use one.
category: Introduction
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

## Anatomy of a Flexiboard

Flexiboards are constructed from a series of components, namely `FlexiBoard`, `FlexiTarget`, and `FlexiWidget`. When used together, they allow you to build drag-and-drop grids for various use cases.

Below is a diagram showing the anatomy of a Flexiboard that would be used for a todos board.
<FlexiBoardAnatomy />

Here's that board in action (with added styling):

<div class="not-prose">
    <FlexiBoard class="flex lg:h-[25vh] flex-col justify-center gap-8 lg:flex-row"
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
                className: (widget: FlexiWidget) => {
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
            <FlexiTarget name="todo" class="gap-2">
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
            <FlexiTarget name="done" class="gap-2">
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

In a Flexiboard, each of these components serves a specific purpose:

- `FlexiBoard` is the main container for the board, creating the drag-and-drop environment. It isolates the targets and widgets; you can have multiple boards on a single page, but widgets cannot be dragged between different FlexiBoards.
- `FlexiTarget` is a dropzone and container for widgets. You can store widgets within it in a customisable layout, and you can move widgets between different FlexiTargets of the same board.
- `FlexiWidget` is the widget itself. These can be moved, resized, and customised in a number of ways. Within a FlexiWidget, you can render content in two ways: either you can use the `children` snippet, or you can use the `component` prop to render any custom component of your choosing. You can also combine them, which is helpful if you want to have a series of consistent looking widgets that can still render their own component.
