---
title: Motion
description: Compare registry transitions and customise their easing.
category: Registry
published: true
---

<script lang="ts">
 import Only from '$lib/components/docs/only.svelte';
 import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

<Only svelte>

```svelte example
<script lang="ts">
	import * as SortableList from '$lib/components/flexi-sortable-list';
	import { springTransitionConfig } from '@flexiboards/svelte';
	import { reducedMotion } from '$lib/components/flexi-motion';

	const configs = {
		css: undefined,
		spring: { widgetDefaults: { transition: springTransitionConfig() } },
		none: { widgetDefaults: { transition: {} } }
	};
	let preset = $state<keyof typeof configs>('css');
	let order = $state(['Plan', 'Build', 'Review']);
	const tasks = ['Plan', 'Build', 'Review'];
</script>

<div class="w-full space-y-4">
	<label class="flex items-center gap-3 text-sm">
		<span>Transition preset</span>
		<select bind:value={preset} class="border-border bg-background rounded-md border px-3 py-2">
			<option value="css">CSS</option>
			<option value="spring">Spring</option>
			<option value="none">None</option>
		</select>
	</label>
	<SortableList.Root config={configs[preset]} onreorder={(ids) => (order = ids)}>
		{#each tasks as task (task)}
			<SortableList.Item id={task}>
				<SortableList.Grabber label={`Move ${task}`} />
				{task}
			</SortableList.Item>
		{/each}
	</SortableList.Root>
	<p class="text-muted-foreground text-sm" aria-live="polite">
		{reducedMotion.current ? 'Reduced motion is on.' : 'Drag a handle to compare the presets.'}
	</p>
	<p class="text-muted-foreground text-sm" aria-live="polite">Order: {order.join(', ')}</p>
</div>
```

</Only>

<Only react>

```tsx example
'use client';
import { useState } from 'react';
import * as SortableList from '@/components/flexi-sortable-list';
import { springTransitionConfig } from '@flexiboards/react';
import { useReducedMotion } from '@/components/flexi-motion';

const configs = {
	css: undefined,
	spring: { widgetDefaults: { transition: springTransitionConfig() } },
	none: { widgetDefaults: { transition: {} } }
};
const tasks = ['Plan', 'Build', 'Review'];

export function MotionDemo() {
	const [preset, setPreset] = useState<keyof typeof configs>('css');
	const [order, setOrder] = useState(tasks);
	const reducedMotion = useReducedMotion();
	return (
		<div className="w-full space-y-4">
			<label className="flex items-center gap-3 text-sm">
				<span>Transition preset</span>
				<select
					value={preset}
					onChange={(event) => setPreset(event.target.value as keyof typeof configs)}
					className="border-border bg-background rounded-md border px-3 py-2"
				>
					<option value="css">CSS</option>
					<option value="spring">Spring</option>
					<option value="none">None</option>
				</select>
			</label>
			<SortableList.Root config={configs[preset]} onReorder={setOrder}>
				{tasks.map((task) => (
					<SortableList.Item key={task} id={task}>
						<SortableList.Grabber label={`Move ${task}`} />
						{task}
					</SortableList.Item>
				))}
			</SortableList.Root>
			<p className="text-muted-foreground text-sm" aria-live="polite">
				{reducedMotion ? 'Reduced motion is on.' : 'Drag a handle to compare the presets.'}
			</p>
			<p className="text-muted-foreground text-sm" aria-live="polite">
				Order: {order.join(', ')}
			</p>
		</div>
	);
}
```

</Only>

Registry boards, dashboards, and sortable lists use `cssTransitionConfig()` by default: 150ms for moves and resizing, and 200ms for drops. The headless components still leave transitions unset.

The layout and reorder callback update as soon as a drop is accepted, while the card animates into place.

The CSS preset uses sine in-out reordering and a circ-out drop. Choose **Spring** for bounce, or **None** to disable movement. Both presets respect your system's reduced-motion setting.

## Installation

Component families install `flexi-motion` as a dependency. You can also install the utility directly:

<Only svelte>

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-motion.json" />

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-motion.json" />

</Only>

## Customise motion

Pass a preset or your own transition through `config.widgetDefaults.transition`. Set it to `{}` to disable movement. Other widget defaults and layout callbacks are preserved.

`cssTransitionConfig()` returns these settings:

| Movement | Duration | Easing      | CSS override          |
| -------- | -------- | ----------- | --------------------- |
| Reorder  | 150ms    | Sine in-out | `--ease-flexi-move`   |
| Drop     | 200ms    | Circ out    | `--ease-flexi-drop`   |
| Resize   | 150ms    | Ease-out    | `--ease-flexi-resize` |

The easing values include fallbacks, so no stylesheet is required. To change a curve across your app, define its token in your global CSS. Tailwind also makes it available as an easing utility:

```css
@theme {
	--ease-flexi-drop: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Change durations in the transition configuration, in milliseconds.

<Only react>

Keep the configuration stable between renders, as the demo does above.

</Only>

The spring preset uses shorter response times and a small bounce on drop:

| Movement | Response | Bounce |
| -------- | -------- | ------ |
| Reorder  | 0.20s    | 0.05   |
| Drop     | 0.24s    | 0.18   |
| Resize   | 0.18s    | 0      |

Spring response times are in seconds and control how quickly the spring reacts. They are not fixed animation durations; the spring stops when it comes to rest.

## Accessibility

Registry roots disable their transition defaults when `prefers-reduced-motion: reduce` matches, including custom presets supplied through `config.widgetDefaults.transition`. The preference is observed while the page is open. Colour and opacity feedback remains available.

<Only svelte>

If you configure motion directly on an individual widget or target, apply `reducedMotion.current` there too. It assumes reduced motion during SSR.

</Only>

<Only react>

If you configure motion directly on an individual widget or target, apply `useReducedMotion()` there too. It assumes reduced motion during SSR.

</Only>

Focus a grabber and press Enter to grab, use the arrow keys to move, then Enter to drop or Escape to cancel. Handles keep their accessible labels and widgets keep their grid semantics with either preset.
