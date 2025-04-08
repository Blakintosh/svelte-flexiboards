---
title: Multiple Targets
description: Learn how to drag and drop widgets between different FlexiTarget dropzones.
category: Guides
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import FlowExample from '$lib/components/docs/flow-grids/flow-example.svelte';
	import Flow2DExample from '$lib/components/docs/flow-grids/flow-2d-example.svelte';
</script>

## Introduction

In many cases, your dashboard or Kanban board needs to be able to support dropping widgets across different categories -- or zones -- on the board.

For example, let's suppose that we have a Kanban board. In its simplest form, we have one list of widgets for the Backlog, another list for the Work-in-Progress, and one more for the Done tasks. 

![Kanban board with multiple targets](/img/multiple_targets_kanban.png)

Here, using just one FlexiTarget for our Kanban board wouldn't be enough, as we have three different [Flow layouts](/docs/flow-grids) to maintain. However, due to the board structure that Flexiboards supports (see [Overview](/docs/overview)), we can have multiple FlexiTargets within the same FlexiBoard.

## Using Multiple Targets

To add a second target, simply create an additional `FlexiTarget` component inside of your `FlexiBoard`. Each `FlexiTarget` has its own configuration, so you can adjust how the layouts behave of one another if you desire. 

However, you can also use the `targetDefaults` property on the `FlexiBoard` configuration object if you want all targets to have consistent behaviour.

The below example demonstrates us creating the Kanban board that we desired earlier.

TODO: Multiple Targets Example

## Examples

The open-source [Notes](/examples/notes) example contains a nested FlexiBoard that creates a Kanban board, which you can use for reference. FlexiBoards can be nested inside FlexiBoards and will act independently -- a FlexiWidget inside a nested FlexiBoard cannot be moved into the outer FlexiBoard.