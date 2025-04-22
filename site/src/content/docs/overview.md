---
title: Overview
description: Learn how to install Flexiboards and create your first Flexiboard.
category: Introduction
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
    import FlexiBoardExample from '$lib/components/docs/overview/flexiboard-example.svelte';

	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

## Installation

Flexiboards is available from npm, and can be installed using your preferred package manager:

```
npm install svelte-flexiboards
```

```
pnpm add svelte-flexiboards
```

```
yarn add svelte-flexiboards
```

Flexiboards was built from the ground up to be a Svelte 5 library, so it is incompatible with Svelte 4 or earlier.

## Anatomy of a Flexiboard

Flexiboards are constructed from a series of components, namely `FlexiBoard`, `FlexiTarget`, and `FlexiWidget`. When used together, they allow you to build drag-and-drop grids for various use cases.

Below is a diagram showing the anatomy of a Flexiboard that would be used for a todos board.
<FlexiBoardAnatomy />

Here's how you would create a board like this in Svelte, using Flexiboards:
```svelte example
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
```

In a Flexiboard, each of these components serves a specific purpose:

- `FlexiBoard` is the main container for the board, creating the drag-and-drop environment. It isolates the targets and widgets; you can have multiple boards on a single page, but widgets cannot be dragged between different FlexiBoards.
- `FlexiTarget` is a dropzone and container for widgets. You can store widgets within it in a customisable layout, and you can move widgets between different FlexiTargets of the same board.
- `FlexiWidget` is the widget itself. These can be moved, resized, and customised in a number of ways. Within a FlexiWidget, you can render content in two ways: either you can use the `children` snippet, or you can use the `component` prop to render any custom component of your choosing. You can also combine them, which is helpful if you want to have a series of consistent looking widgets that can still render their own component.
