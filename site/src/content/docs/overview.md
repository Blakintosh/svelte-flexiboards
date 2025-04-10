---
title: Overview
description: Learn what a Flexiboard is and how to use one.
category: Introduction
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
    import FlexiBoardExample from '$lib/components/docs/overview/flexiboard-example.svelte';

	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

## Anatomy of a Flexiboard

Flexiboards are constructed from a series of components, namely `FlexiBoard`, `FlexiTarget`, and `FlexiWidget`. When used together, they allow you to build drag-and-drop grids for various use cases.

Below is a diagram showing the anatomy of a Flexiboard that would be used for a todos board.
<FlexiBoardAnatomy />

Here's that board in action (with added styling):
<FlexiBoardExample />

In a Flexiboard, each of these components serves a specific purpose:

- `FlexiBoard` is the main container for the board, creating the drag-and-drop environment. It isolates the targets and widgets; you can have multiple boards on a single page, but widgets cannot be dragged between different FlexiBoards.
- `FlexiTarget` is a dropzone and container for widgets. You can store widgets within it in a customisable layout, and you can move widgets between different FlexiTargets of the same board.
- `FlexiWidget` is the widget itself. These can be moved, resized, and customised in a number of ways. Within a FlexiWidget, you can render content in two ways: either you can use the `children` snippet, or you can use the `component` prop to render any custom component of your choosing. You can also combine them, which is helpful if you want to have a series of consistent looking widgets that can still render their own component.
