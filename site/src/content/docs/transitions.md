---
title: Transitions
description: Animate your Flexiboard components with CSS transitions.
category: Guides
published: true
---

## Introduction

Being a headless library, a default Flexiboard does not animate the movement of widgets.

However, manually adding transitions outside of the library would be tricky. CSS transitions do not animate when `grid-row` and `grid-column` values change, which Flexiboards uses under the hood to position placed widgets.

In order to solve this, Flexiboards has a built-in system that allows you to animate the movement of widgets with CSS transitions.

## Enabling Transitions

Flexiboards has a built-in helper for quickly adding default transitions to your widgets, `simpleTransitionConfig()`. Apply this to the `transition` property of your widget [configuration](/docs/configuration) to get a basic set of animations for widget movement events.

Here's how that looks, once applied:

```svelte example
<script lang="ts">
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { FlexiBoard, FlexiTarget, FlexiWidget, simpleTransitionConfig } from 'svelte-flexiboards';
	import { untrack } from 'svelte';

	let enableTransitions: boolean = $state(true);

	let boardConfig = $state({
		rowSizing: 'minmax(0, 1fr)',
		layout: {
			type: 'free',
			minRows: 2,
			minColumns: 2,
			maxRows: 2,
			maxColumns: 2
		},
		widgetDefaults: {
			transition: undefined,
			className: (widget) => [
				'rounded-lg bg-primary px-4 py-2 text-primary-foreground',
				widget.isShadow && 'opacity-50',
				widget.isGrabbed && 'animate-pulse opacity-50'
			]
		}
	});

	$effect(() => {
		const newEnableTransitions = enableTransitions;

		// Update the config in-place, otherwise the board loses the proxy.
		untrack(() => {
			boardConfig.widgetDefaults.transition = enableTransitions
				? simpleTransitionConfig()
				: undefined;
		});
	});

	$inspect(boardConfig);
</script>

<div
	class="flex w-72 items-center justify-center gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96"
>
	<Switch id="edit-mode" bind:checked={enableTransitions} />
	<Label for="edit-mode">Enable transitions</Label>
</div>

<FlexiBoard class="size-72 rounded-b-xl border p-8 lg:size-96">
	<FlexiTarget
		class={'h-full w-full gap-4 lg:gap-6'}
		containerClass={'w-full h-full'}
		config={boardConfig}
	>
		<FlexiWidget x={0} y={0}>A</FlexiWidget>
		<FlexiWidget x={1} y={0}>B</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

## Customising Transitions

On a FlexiWidget's configuration (or the defaults of a FlexiTarget or FlexiBoard), you can specify a `transition` property.

This property is an object that can contain the following properties:

- `duration`: The duration of the transition in milliseconds.
- `easing`: The easing function to use for the transition. This can be any valid CSS easing function, including `cubic-bezier()`.

When not specified, no transition will be applied.
