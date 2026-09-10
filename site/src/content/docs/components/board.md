---
title: FlexiBoard
description: The main container component of a board, managing the targets and widgets within it.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import ApiProps from '$lib/components/docs/api-props.svelte';
    import Only from '$lib/components/docs/only.svelte';
    import api from '$lib/generated/api/flexi-board.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs`. Edit the JSDoc in the source, not this page.
-->

## FlexiBoard (component)

<ApiProps {api} />

<Only svelte>

```svelte
<script lang="ts">
	import { FlexiBoard, FlexiTarget } from '@flexiboards/svelte';
</script>

<FlexiBoard class="flex gap-4" config={{ widgetDefaults: { draggability: 'full' } }}>
	<FlexiTarget key="main">
		<!-- widgets go here -->
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx
import { FlexiBoard, FlexiTarget } from '@flexiboards/react';

export function Board() {
	return (
		<FlexiBoard className="flex gap-4" config={{ widgetDefaults: { draggability: 'full' } }}>
			<FlexiTarget keyName="main">{/* widgets go here */}</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

## FlexiBoardController

`FlexiBoard` uses a [controller](/docs/controllers) to manage its state and behaviour.

<Only svelte>

You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from '@flexiboards/svelte';

	let board: FlexiBoardController | undefined = $state();
</script>

<FlexiBoard bind:controller={board}>
	<!-- targets go here -->
</FlexiBoard>
```

</Only>

<Only react>

React has no two-way binding, so you reach the controller through the `onfirstcreate` callback. From any component rendered inside the board you can also call the `useFlexiBoard()` hook.

```tsx
import { useRef } from 'react';
import { FlexiBoard, useFlexiBoard, type FlexiBoardController } from '@flexiboards/react';

export function Board() {
	const board = useRef<FlexiBoardController | null>(null);

	return (
		<FlexiBoard onfirstcreate={(controller) => (board.current = controller)}>
			{/* targets go here */}
		</FlexiBoard>
	);
}

// Inside any descendant of the board:
function Toolbar() {
	const board = useFlexiBoard();
	// reading a property here re-renders the component when it changes
	return <span>Current breakpoint: {board.breakpoint}</span>;
}
```

</Only>

Use the `FlexiBoardController` to manage the board directly and carry out actions.

<ApiReference title="Properties" api={api.controller.properties} />

<ApiReference title="Methods" api={api.controller.methods} />

## FlexiBoardConfiguration

The configuration object for the `FlexiBoard` component, which supports reactivity where specified.

<Only svelte>

For reactivity, give the `config` prop a reactive source (a proxy).

</Only>

<Only react>

For reactivity, hold the configuration in state and pass a new object when it changes, for example with `useState` and `useMemo`. Mutating the object in place is not picked up.

In the React adapter, class-valued properties are plain strings, or functions returning strings.

</Only>

<ApiReference title="Properties" api={api.types.FlexiBoardConfiguration} />

### FlexiTargetDefaults

The default configuration for targets.

<ApiReference title="Properties" api={api.types.FlexiTargetDefaults} />

### Interaction callbacks

`onWidgetGrab`, `onWidgetDrop`, `onWidgetCancel` and `onWidgetDelete` receive these events. `canDrop` receives a `FlexiDropCheck` and returns whether the placement is allowed; see [Reacting to interactions](/docs/controllers#reacting-to-interactions) for when each fires.

#### FlexiWidgetEvent

<ApiReference title="Properties" api={api.types.FlexiWidgetEvent} />

#### FlexiWidgetDropEvent

<ApiReference title="Properties" api={api.types.FlexiWidgetDropEvent} />

#### FlexiDropCheck

<ApiReference title="Properties" api={api.types.FlexiDropCheck} />

### FlexiWidgetDefaults

The default configuration for widgets.

<ApiReference title="Properties" api={api.types.FlexiWidgetDefaults} />

## FlexiLayout

The value returned by `exportLayout()` and accepted by `importLayout()`, `initialLayout`, and `loadLayout`. It maps each target's `key` to an array of entries. See [Exporting & Importing](/docs/guides/exporting-importing-boards).

### FlexiWidgetLayoutEntry

<ApiReference title="Properties" api={api.types.FlexiWidgetLayoutEntry} />

### FlexiRegistryEntry

An entry in the board's `registry`, keyed by widget `type`. Its properties are widget defaults applied to every widget of that type.

<ApiReference title="Properties" api={api.types.FlexiRegistryEntry} />

## Accessibility

The board renders as `role="application"`, described by a visually hidden instructions element, and carries `aria-busy` while a layout is [pending](/docs/guides/server-side-rendering). It also hosts the `aria-live` announcer that reports grabs, resizes, releases, and rejected drops. See [Accessibility](/docs/accessibility).
