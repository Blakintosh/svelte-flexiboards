---
title: Transitions
description: Animate widget movement with CSS transitions or springs.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

Flexiboards is headless, so widgets jump between cells by default. Set `transition` on a widget, or on `widgetDefaults`, to animate the movement instead. `cssTransitionConfig()` supplies the default durations and easing. These demos use native controls and the [example styling](/docs/overview#example-styling). They disable movement when the system requests reduced motion:

<Only svelte>

```svelte example
<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		cssTransitionConfig,
		type FlexiTargetPartialConfiguration
	} from '@flexiboards/svelte';
	import { onMount } from 'svelte';

	let enableTransitions = $state(true);
	let reducedMotion = $state(true);

	onMount(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => {
			reducedMotion = query.matches;
		};
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	const targetConfig: FlexiTargetPartialConfiguration = $derived({
		layout: { type: 'free', minRows: 2, maxRows: 2, minColumns: 2, maxColumns: 2 },
		columnSizing: '100px',
		rowSizing: '100px',
		widgetDefaults: {
			transition: enableTransitions && !reducedMotion ? cssTransitionConfig() : undefined,
			className: 'rounded-lg border bg-primary p-4 text-primary-foreground'
		}
	});
</script>

<label><input type="checkbox" bind:checked={enableTransitions} /> Enable transitions</label>
<p>
	{reducedMotion
		? 'Reduced motion is on; widgets move without animation.'
		: 'Drag A or B to another cell.'}
</p>
<FlexiBoard>
	<FlexiTarget key="main" config={targetConfig}>
		<FlexiWidget x={0} y={0}>A</FlexiWidget>
		<FlexiWidget x={1} y={1}>B</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example
import {
	FlexiBoard,
	FlexiTarget,
	FlexiWidget,
	cssTransitionConfig,
	type FlexiTargetPartialConfiguration
} from '@flexiboards/react';
import { useEffect, useMemo, useState } from 'react';

export function TransitionsExample() {
	const [enableTransitions, setEnableTransitions] = useState(true);
	const [reducedMotion, setReducedMotion] = useState(true);

	useEffect(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => setReducedMotion(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	const targetConfig = useMemo<FlexiTargetPartialConfiguration>(
		() => ({
			layout: { type: 'free', minRows: 2, maxRows: 2, minColumns: 2, maxColumns: 2 },
			columnSizing: '100px',
			rowSizing: '100px',
			widgetDefaults: {
				transition: enableTransitions && !reducedMotion ? cssTransitionConfig() : undefined,
				className: 'rounded-lg border bg-primary p-4 text-primary-foreground'
			}
		}),
		[enableTransitions, reducedMotion]
	);

	return (
		<>
			<label>
				<input
					type="checkbox"
					checked={enableTransitions}
					onChange={(event) => setEnableTransitions(event.target.checked)}
				/>{' '}
				Enable transitions
			</label>
			<p>
				{reducedMotion
					? 'Reduced motion is on; widgets move without animation.'
					: 'Drag A or B to another cell.'}
			</p>
			<FlexiBoard>
				<FlexiTarget keyName="main" config={targetConfig}>
					<FlexiWidget x={0} y={0}>
						A
					</FlexiWidget>
					<FlexiWidget x={1} y={1}>
						B
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		</>
	);
}
```

</Only>

Enable transitions and drag a widget to an empty cell. The dropped widget animates into place unless reduced motion is enabled. Toggle the system preference while the demo is open to check that it updates.

## Choosing a preset

Two presets ship with the library. Each returns a complete `transition` configuration:

- `cssTransitionConfig()` uses sine in-out for 150ms moves, circ-out for 200ms drops, and ease-out for 150ms resizing.
- `springTransitionConfig()` uses response times of 0.20s for moves, 0.24s for drops, and 0.18s for resizing, with a small bounce on drop. These control the spring's response, rather than a fixed end time.

`simpleTransitionConfig()` is deprecated. It retains the original 150ms preset, with `ease-in-out` for moves and `ease-out` for drops and resizing.

The CSS preset accepts global easing overrides through `--ease-flexi-move`, `--ease-flexi-drop`, and `--ease-flexi-resize`. [Compare CSS and spring motion in the registry demo](/docs/registry/motion).

## Customising transitions

A `transition` configuration has three optional entries, `move`, `drop`, and `resize`, one per kind of widget movement. Each is either a plain `{ duration, easing }` object (a CSS transition, with `duration` in milliseconds and any CSS easing function including `cubic-bezier()`), or an animation adapter:

- `cssTransition({ duration, easing })` is what the plain object resolves to.
- `spring({ duration, bounce })` is a dependency-free spring using SwiftUI's parameterisation: `duration` in seconds is the response time, and `bounce` runs from `0` (critically damped) to `1`.

Mix them per entry, for example a spring for `drop` and a CSS transition for `resize`. Any entry you omit plays no animation. The exact shape is in the [FlexiWidgetTransitionConfiguration reference](/docs/components/widget#flexiwidgettransitionconfiguration).

The example below drives the `move` and `drop` durations from a slider:

<Only svelte>

```svelte example
<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		cssTransitionConfig,
		type FlexiTargetPartialConfiguration
	} from '@flexiboards/svelte';
	import { onMount } from 'svelte';

	let duration = $state(150);
	let reducedMotion = $state(true);

	onMount(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => {
			reducedMotion = query.matches;
		};
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	const targetConfig: FlexiTargetPartialConfiguration = $derived({
		layout: { type: 'free', minRows: 2, maxRows: 2, minColumns: 2, maxColumns: 2 },
		columnSizing: '100px',
		rowSizing: '100px',
		widgetDefaults: {
			transition: !reducedMotion
				? { move: { duration, easing: 'ease-in-out' }, drop: { duration, easing: 'ease-out' } }
				: undefined,
			className: 'rounded-lg border bg-primary p-4 text-primary-foreground'
		}
	});
</script>

<label
	>Transition duration: {duration}ms
	<input type="range" min="50" max="500" step="50" bind:value={duration} /></label
>
<p>
	{reducedMotion
		? 'Reduced motion is on; widgets move without animation.'
		: 'Drag A or B to another cell.'}
</p>
<FlexiBoard>
	<FlexiTarget key="main" config={targetConfig}>
		<FlexiWidget x={0} y={0}>A</FlexiWidget>
		<FlexiWidget x={1} y={1}>B</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example
import {
	FlexiBoard,
	FlexiTarget,
	FlexiWidget,
	cssTransitionConfig,
	type FlexiTargetPartialConfiguration
} from '@flexiboards/react';
import { useEffect, useMemo, useState } from 'react';

export function CustomTransitionsExample() {
	const [duration, setDuration] = useState(150);
	const [reducedMotion, setReducedMotion] = useState(true);

	useEffect(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => setReducedMotion(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	const targetConfig = useMemo<FlexiTargetPartialConfiguration>(
		() => ({
			layout: { type: 'free', minRows: 2, maxRows: 2, minColumns: 2, maxColumns: 2 },
			columnSizing: '100px',
			rowSizing: '100px',
			widgetDefaults: {
				transition: !reducedMotion
					? { move: { duration, easing: 'ease-in-out' }, drop: { duration, easing: 'ease-out' } }
					: undefined,
				className: 'rounded-lg border bg-primary p-4 text-primary-foreground'
			}
		}),
		[duration, reducedMotion]
	);

	return (
		<>
			<label>
				Transition duration: {duration}ms{' '}
				<input
					type="range"
					min={50}
					max={500}
					step={50}
					value={duration}
					onChange={(event) => setDuration(Number(event.target.value))}
				/>
			</label>
			<p>
				{reducedMotion
					? 'Reduced motion is on; widgets move without animation.'
					: 'Drag A or B to another cell.'}
			</p>
			<FlexiBoard>
				<FlexiTarget keyName="main" config={targetConfig}>
					<FlexiWidget x={0} y={0}>
						A
					</FlexiWidget>
					<FlexiWidget x={1} y={1}>
						B
					</FlexiWidget>
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
