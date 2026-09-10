---
title: Transitions
description: Animate widget movement with CSS transitions or springs.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

Flexiboards is headless, so widgets jump between cells by default. Set `transition` on a widget, or on `widgetDefaults`, to animate the movement instead. `cssTransitionConfig()` gives you a sensible default:

<Only svelte>

```svelte example
<script lang="ts">
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { FlexiBoard, FlexiTarget, FlexiWidget, cssTransitionConfig } from '@flexiboards/svelte';
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
				? cssTransitionConfig()
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

</Only>

<Only react>

```tsx example
import { FlexiBoard, FlexiTarget, FlexiWidget, cssTransitionConfig } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';
import { useMemo, useState } from 'react';

export function TransitionsExample() {
	const [enableTransitions, setEnableTransitions] = useState(true);

	// The config is derived from state, so flipping the switch hands the board a
	// new object and the widgets pick up the change.
	const targetConfig = useMemo(
		() => ({
			rowSizing: 'minmax(0, 1fr)',
			layout: {
				type: 'free' as const,
				minRows: 2,
				minColumns: 2,
				maxRows: 2,
				maxColumns: 2
			},
			widgetDefaults: {
				transition: enableTransitions ? cssTransitionConfig() : undefined,
				className: (widget: FlexiWidgetController) =>
					clsx(
						'rounded-lg bg-primary px-4 py-2 text-primary-foreground',
						widget.isShadow && 'opacity-50',
						widget.isGrabbed && 'animate-pulse opacity-50'
					)
			}
		}),
		[enableTransitions]
	);

	return (
		<>
			<div className="flex w-72 items-center justify-center gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
				<input
					id="enable-transitions"
					type="checkbox"
					checked={enableTransitions}
					onChange={(e) => setEnableTransitions(e.target.checked)}
				/>
				<label htmlFor="enable-transitions">Enable transitions</label>
			</div>

			<FlexiBoard className="size-72 rounded-b-xl border p-8 lg:size-96">
				<FlexiTarget
					className="h-full w-full gap-4 lg:gap-6"
					containerClassName="w-full h-full"
					config={targetConfig}
				>
					<FlexiWidget x={0} y={0}>A</FlexiWidget>
					<FlexiWidget x={1} y={0}>B</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		</>
	);
}
```

</Only>

Toggle the switch and drag a widget: with transitions on, the other widget glides out of the way and the dropped widget settles into its cell.

## Choosing a preset

Two presets ship with the library. Each returns a complete `transition` configuration:

- `cssTransitionConfig()` uses CSS-style easing, `ease-in-out` for moves and `ease-out` for drops.
- `springTransitionConfig()` uses a physics spring with a little bounce on drop.

`simpleTransitionConfig()` is a deprecated alias of `cssTransitionConfig()`.

## Customising transitions

A `transition` configuration has three optional entries, `move`, `drop`, and `resize`, one per kind of widget movement. Each is either a plain `{ duration, easing }` object (a CSS transition, with `duration` in milliseconds and any CSS easing function including `cubic-bezier()`), or an animation adapter:

- `cssTransition({ duration, easing })` is what the plain object resolves to.
- `spring({ duration, bounce })` is a dependency-free spring using SwiftUI's parameterisation: `duration` in seconds is the response time, and `bounce` runs from `0` (critically damped) to `1`.

Mix them per entry, for example a spring for `drop` and a CSS transition for `resize`. Any entry you omit plays no animation. The exact shape is in the [FlexiWidgetTransitionConfiguration reference](/docs/components/widget#flexiwidgettransitionconfiguration).

The example below drives the `move` and `drop` durations from a slider:

<Only svelte>

```svelte example
<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { FlexiBoard, FlexiTarget, FlexiWidget, cssTransitionConfig } from '@flexiboards/svelte';
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

</Only>

<Only react>

```tsx example
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';
import { useMemo, useState } from 'react';

export function CustomTransitionsExample() {
	const [duration, setDuration] = useState(150);

	const targetConfig = useMemo(
		() => ({
			rowSizing: 'minmax(0, 1fr)',
			layout: {
				type: 'free' as const,
				minRows: 2,
				minColumns: 2,
				maxRows: 2,
				maxColumns: 2
			},
			widgetDefaults: {
				transition: {
					move: { duration, easing: 'ease-in-out' },
					drop: { duration, easing: 'ease-out' }
				},
				className: (widget: FlexiWidgetController) =>
					clsx(
						'rounded-lg bg-primary px-4 py-2 text-primary-foreground',
						widget.isShadow && 'opacity-50',
						widget.isGrabbed && 'animate-pulse opacity-50'
					)
			}
		}),
		[duration]
	);

	return (
		<>
			<div className="flex w-72 flex-col items-center justify-center gap-4 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
				<label htmlFor="transition-duration">Transition duration: {duration}ms</label>
				<input
					id="transition-duration"
					type="range"
					min={50}
					max={500}
					step={50}
					value={duration}
					onChange={(e) => setDuration(Number(e.target.value))}
				/>
			</div>

			<FlexiBoard className="size-72 rounded-b-xl border p-8 lg:size-96">
				<FlexiTarget
					className="h-full w-full gap-4 lg:gap-6"
					containerClassName="w-full h-full"
					config={targetConfig}
				>
					<FlexiWidget x={0} y={0}>A</FlexiWidget>
					<FlexiWidget x={1} y={0}>B</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		</>
	);
}
```

</Only>

## Gotchas

- **Why plain CSS transitions don't work.** Widgets are placed with `grid-row` and `grid-column`, which CSS cannot transition. The library measures the before and after boxes and animates a transform between them, so add your transitions through this configuration rather than a stylesheet.
- **Reduced motion.** Transitions are opt-in, so honour `prefers-reduced-motion` by leaving `transition` unset when it matches. See [Accessibility](/docs/accessibility).
- **Configuration lives in core.** The presets, adapters, and types come from `@flexiboards/core` and are re-exported by each adapter package, so the configuration is identical across frameworks.
