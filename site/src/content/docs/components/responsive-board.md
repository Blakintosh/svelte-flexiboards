---
title: ResponsiveFlexiBoard
description: A wrapper component that manages different board layouts for different viewport breakpoints.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/responsive-flexi-board.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## ResponsiveFlexiBoard (component)

<ApiProps {api} />

<Only svelte>

This excerpt assumes `DesktopBoard` and `MobileBoard` are your existing board components. The `lg`, `md`, `sm` and `xs` props are snippets, one per breakpoint; `children` is the fallback snippet used when no breakpoint snippet matches, and receives the current breakpoint.

```svelte
<script lang="ts">
	import { ResponsiveFlexiBoard } from '@flexiboards/svelte';

	import DesktopBoard from './desktop-board.svelte';
	import MobileBoard from './mobile-board.svelte';
</script>

<ResponsiveFlexiBoard>
	{#snippet lg()}
		<DesktopBoard />
	{/snippet}

	{#snippet xs()}
		<MobileBoard />
	{/snippet}
</ResponsiveFlexiBoard>
```

</Only>

<Only react>

This excerpt assumes `DesktopBoard` and `MobileBoard` are your existing board components. The `lg`, `md`, `sm` and `xs` props take nodes, one per breakpoint; `children` is the fallback used when no breakpoint prop matches, and can be a function receiving the current breakpoint.

```tsx
import { ResponsiveFlexiBoard } from '@flexiboards/react';

import { DesktopBoard } from './desktop-board';
import { MobileBoard } from './mobile-board';

export function Board() {
	return (
		<ResponsiveFlexiBoard lg={<DesktopBoard />} xs={<MobileBoard />}>
			{({ currentBreakpoint }) => <p>No board for {currentBreakpoint}.</p>}
		</ResponsiveFlexiBoard>
	);
}
```

</Only>

## ResponsiveFlexiBoardController

<Only svelte>

You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

</Only>

<Only react>

You can access the controller from the `onfirstcreate` callback. From any component rendered inside the board, call the `useResponsiveFlexiBoard()` hook.

</Only>

<ApiReference title="Properties" api={api.controller.properties} reactApi={api.controllerReact.properties} />

<ApiReference title="Methods" api={api.controller.methods} reactApi={api.controllerReact.methods} />

## ResponsiveFlexiBoardConfiguration

The configuration object for the `ResponsiveFlexiBoard` component.

<ApiReference title="Properties" api={api.types.ResponsiveFlexiBoardConfiguration} reactApi={api.typesReact.ResponsiveFlexiBoardConfiguration} />

## ResponsiveFlexiLayout

A `ResponsiveFlexiLayout` maps breakpoint keys to `FlexiLayout` objects. Entries use the same IDs and registry types as [ordinary stored layouts](/docs/guides/exporting-importing-boards).

This illustrative JSON contains stored layouts for two visited breakpoints:

```json
{
	"lg": { "main": [{ "id": "chart", "type": "chart", "x": 0, "y": 0, "width": 2, "height": 2 }] },
	"default": {
		"main": [{ "id": "chart", "type": "chart", "x": 0, "y": 0, "width": 1, "height": 2 }]
	}
}
```

Layouts are initialized lazily, so only breakpoints that have actually been visited have stored layouts.

## Accessibility

Each child board provides the [keyboard interactions and announcements](/docs/accessibility). Switching breakpoint content can unmount the focused element. The responsive wrapper does not transfer focus to a corresponding widget in the new layout. If your application needs that behavior, track the focused widget's stable ID and restore focus after the replacement board mounts. Avoid moving focus when it was outside the board.
