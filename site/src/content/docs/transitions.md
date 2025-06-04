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
</script>

<div
	class="flex w-72 items-center justify-center gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96"
>
	<Switch id="enable-transitions" bind:checked={enableTransitions} />
	<Label for="enable-transitions">Enable transitions</Label>
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

For many sitations, this base configuration might suffice for you. However, we next discuss how you can set up your own transition configuration.

## Customising Transitions

The `simpleTransitionConfig()` is just a wrapper that returns a default configuration for you. However, the actual schema for transition configurations is as follows:

```ts
export type FlexiWidgetTransitionConfiguration = {
	move?: FlexiWidgetTransitionTypeConfiguration;
	drop?: FlexiWidgetTransitionTypeConfiguration;
};
```

where `move` determines the transition that plays when a widget moves across cells of a board, and `drop` determines the transition that plays when a widget is released.

Within, the parameters are:

```ts
export type FlexiWidgetTransitionTypeConfiguration = {
	duration?: number;
	easing?: string;
};
```

- `duration` controls how long the transition plays for, in milliseconds.
- `easing` is any valid CSS easing function to determine the transition curve, including `cubic-bezier()`. For example, the `simpleTransitionConfig` uses `ease-in-out` for move and `ease-out` for drop.

Note that if you omit either of the above properties, or the configuration object entirely, Flexiboards defaults to the behaviour of playing no transition for that scenario.

The below example puts this customisability into use:

```svelte example
<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { FlexiBoard, FlexiTarget, FlexiWidget, simpleTransitionConfig } from 'svelte-flexiboards';
	import { untrack } from 'svelte';

	let duration: number = $state(150);

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
		const newDuration = duration;

		// Update the config in-place, otherwise the board loses the proxy.
		untrack(() => {
			boardConfig.widgetDefaults.transition = {
				move: {
					duration: newDuration,
					easing: 'ease-in-out'
				},
				drop: {
					duration: newDuration,
					easing: 'ease-out'
				}
			};
		});
	});
</script>

<div
	class="flex w-72 flex-col items-center justify-center gap-4 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96"
>
	<Label for="transition-duration">Transition duration: {duration}ms</Label>
	<Slider
		name="transition-duration"
		type="single"
		bind:value={duration}
		max={500}
		min={50}
		step={50}
	/>
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
