---
title: Grabber
description: Move widgets with a small, theme-aware handle.
category: Registry
published: true
---

<script lang="ts">
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
 import Only from '$lib/components/docs/only.svelte';
 import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

A styled [FlexiGrab](/docs/components/grab) button for use inside a `FlexiWidget`. Install it from the registry, then import the copied source from your app.

## Preview

<Only svelte>

```svelte example
<script lang="ts">
	import { FlexiDashboard, FlexiWidget } from '@flexiboards/svelte';
	import Grabber from '$lib/components/flexi-handles/grabber.svelte';
</script>

<FlexiDashboard
	columns={2}
	rows={2}
	resizable
	class="w-full gap-3"
	targetConfig={{ rowSizing: '100px' }}
>
	<FlexiWidget
		x={0}
		y={0}
		class="bg-card text-card-foreground border-border relative flex items-center gap-3 rounded-xl border p-4"
	>
		<Grabber label="Move notes" />
		<span class="text-sm">Notes</span>
	</FlexiWidget>
</FlexiDashboard>
```

</Only>

<Only react>

```tsx example
'use client';
import { FlexiDashboard, FlexiWidget } from '@flexiboards/react';
import { Grabber } from '@/components/flexi-handles/grabber';

export function GrabberDemo() {
	return (
		<FlexiDashboard
			columns={2}
			rows={2}
			resizable
			className="w-full gap-3"
			targetConfig={{ rowSizing: '100px' }}
		>
			<FlexiWidget
				x={0}
				y={0}
				className="bg-card text-card-foreground border-border relative flex items-center gap-3 rounded-xl border p-4"
			>
				<Grabber label="Move notes" />
				<span className="text-sm">Notes</span>
			</FlexiWidget>
		</FlexiDashboard>
	);
}
```

</Only>

## Installation

Start with a Tailwind project configured for shadcn and its theme variables. This copies editable source into your components directory; it does not install a second theme.

<Only svelte>

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-grabber.json" />

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-grabber.json" />

</Only>

## Usage

<Only svelte>

The default install location is `src/lib/components/flexi-handles/grabber.svelte`. Import it in your app:

```svelte
<script lang="ts">
	import Grabber from '$lib/components/flexi-handles/grabber.svelte';
</script>
```

</Only>

<Only react>

The CLI copies `grabber.tsx` into `flexi-handles` under your configured components directory. Import it through your app's alias:

```tsx
import { Grabber } from '@/components/flexi-handles/grabber';
```

</Only>

The handle is also re-exported from the component families.

## API

| Prop                                                    | Default            | Purpose                                                                                                                            |
| ------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `label`                                                 | `Move widget`      | Screen-reader text; use a specific label when several handles are present.                                                         |
| `size`                                                  | `16`               | Icon size in pixels. The button remains 32px.                                                                                      |
| <FrameworkText svelte="class" react="className" code /> | —                  | Override styles; accepts a widget-state function too.                                                                              |
| `children`                                              | Vertical grip icon | Replace the icon with <FrameworkText svelte="a snippet" react="a render function or content" />. The accessible label is retained. |

## Behavior and keyboard access

A grabber must be inside a draggable widget. All three registry roots enable dragging by default. Once a grabber is mounted, the widget body no longer initiates a drag; the handle does.

Focus the handle and press Enter to start, use arrow keys to move the virtual pointer, press Enter to finish, and Escape to cancel. See [Accessibility](/docs/accessibility) for the full keyboard model.

These are real non-submit buttons. Don't nest links, buttons, or inputs inside a handle; put them alongside it. For larger touch targets, override with `size-11`.

## Styling

Colors come from `muted-foreground`, `accent`, `accent-foreground`, and `ring`. No hard-coded palette or dark-mode override is installed. The defaults inherit your existing shadcn theme.
