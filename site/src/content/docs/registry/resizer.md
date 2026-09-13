---
title: Resizer
description: Resize widgets with a small, theme-aware handle.
category: Registry
published: true
---

<script lang="ts">
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
 import Only from '$lib/components/docs/only.svelte';
 import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

A styled [FlexiResize](/docs/components/resize) button for use inside a `FlexiWidget`. Install it from the registry, then import the copied source from your app.

## Preview

<Only svelte>

```svelte example
<script lang="ts">
	import { FlexiDashboard, FlexiWidget } from '@flexiboards/svelte';
	import Resizer from '$lib/components/flexi-handles/resizer.svelte';
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
		<Resizer label="Resize notes" class="absolute bottom-1 right-1" />
		<span class="text-sm">Notes</span>
	</FlexiWidget>
</FlexiDashboard>
```

</Only>

<Only react>

```tsx example
'use client';
import { FlexiDashboard, FlexiWidget } from '@flexiboards/react';
import { Resizer } from '@/components/flexi-handles/resizer';

export function ResizerDemo() {
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
				<Resizer label="Resize notes" className="absolute bottom-1 right-1" />
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

<InstallCommand action="dlx" package="shadcn-svelte@latest add https://flexiboards.dev/r/svelte/flexi-resizer.json" />

</Only>

<Only react>

<InstallCommand action="dlx" package="shadcn@latest add https://flexiboards.dev/r/react/flexi-resizer.json" />

</Only>

## Usage

<Only svelte>

The default install location is `src/lib/components/flexi-handles/resizer.svelte`. Import it in your app:

```svelte
<script lang="ts">
	import Resizer from '$lib/components/flexi-handles/resizer.svelte';
</script>
```

</Only>

<Only react>

The CLI copies `resizer.tsx` into `flexi-handles` under your configured components directory. Import it through your app's alias:

```tsx
import { Resizer } from '@/components/flexi-handles/resizer';
```

</Only>

The handle is also re-exported from the component families.

## API

| Prop                                                    | Default              | Purpose                                                                                                                            |
| ------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `label`                                                 | `Resize widget`      | Screen-reader text; use a specific label when several handles are present.                                                         |
| `size`                                                  | `16`                 | Icon size in pixels. The button remains 32px.                                                                                      |
| <FrameworkText svelte="class" react="className" code /> | None                 | Override styles; accepts a widget-state function too.                                                                              |
| `children`                                              | Diagonal resize icon | Replace the icon with <FrameworkText svelte="a snippet" react="a render function or content" />. The accessible label is retained. |

## Behavior and keyboard access

Enable widget resizing with `resizability="both"`, `"horizontal"`, or `"vertical"`. The Dashboard registry root enables both axes by default. Merely adding a handle does not enable resizing.

Focus the handle and press Enter to start, use arrow keys to move the virtual pointer, press Enter to finish, and Escape to cancel. See [Accessibility](/docs/accessibility) for the full keyboard model.

These are real non-submit buttons. Don't nest links, buttons, or inputs inside a handle; put them alongside it. For larger touch targets, override with `size-11`.

## Styling

Colors come from `muted-foreground`, `accent`, `accent-foreground`, and `ring`. No hard-coded palette or dark-mode override is installed. The defaults inherit your existing shadcn theme.
