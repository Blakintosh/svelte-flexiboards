---
title: Exporting and importing layouts
description: Save a board's widget layout as JSON and restore it later.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

Save a board's widget IDs, positions, sizes, types, and metadata as JSON. To restore rendered widgets, give each one a `type` and register its renderer on the board. The example saves a versioned layout in memory. Drag a widget after saving, then select Restore to return to the saved positions.

The preview uses utility classes from the [docs example styling](/docs/overview#example-styling). Layout persistence itself needs no styling dependency.

<Only svelte>

```svelte example title="Save and restore"
<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiBoardController,
		type FlexiLayoutEnvelope,
		type FlexiWidgetController
	} from '@flexiboards/svelte';

	let board = $state<FlexiBoardController>();
	let saved = $state<FlexiLayoutEnvelope>();
</script>

{#snippet label({ widget }: { widget: FlexiWidgetController })}
	{widget.metadata?.label}
{/snippet}

<div class="flex w-72 gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
	<button
		class="rounded-md border px-3 py-1 text-sm"
		onclick={() => (saved = board?.exportLayoutEnvelope())}
	>
		Save
	</button>
	<button
		class="rounded-md border px-3 py-1 text-sm"
		disabled={!saved}
		onclick={() => saved && board?.importLayout(saved)}
	>
		Restore
	</button>
</div>

<FlexiBoard
	bind:controller={board}
	class="size-72 rounded-b-xl border p-8 lg:size-96"
	config={{
		registry: {
			tile: {
				snippet: label,
				className: 'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
				draggability: 'full'
			}
		}
	}}
>
	<FlexiTarget
		key="main"
		class="h-full w-full gap-4"
		containerClass="h-full w-full"
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: { type: 'free', minRows: 2, minColumns: 2, maxRows: 2, maxColumns: 2 }
		}}
	>
		<FlexiWidget type="tile" x={0} y={0} metadata={{ label: 'A' }} />
		<FlexiWidget type="tile" x={1} y={1} metadata={{ label: 'B' }} />
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="Save and restore"
import { FlexiBoard, FlexiTarget, FlexiWidget, useFlexiWidget } from '@flexiboards/react';
import type { FlexiBoardController, FlexiLayoutEnvelope } from '@flexiboards/react';
import { useRef, useState } from 'react';

function Label() {
	const widget = useFlexiWidget();
	return <>{String(widget.metadata?.label ?? '')}</>;
}

const boardConfig = {
	registry: {
		tile: {
			component: Label,
			className: 'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
			draggability: 'full'
		}
	}
} as const;

export function SaveAndRestore() {
	const board = useRef<FlexiBoardController>(null);
	const [saved, setSaved] = useState<FlexiLayoutEnvelope>();

	return (
		<>
			<div className="flex w-72 gap-2 rounded-t-xl border border-b-0 px-4 py-3 lg:w-96">
				<button
					className="rounded-md border px-3 py-1 text-sm"
					onClick={() => setSaved(board.current?.exportLayoutEnvelope())}
				>
					Save
				</button>
				<button
					className="rounded-md border px-3 py-1 text-sm"
					disabled={!saved}
					onClick={() => saved && board.current?.importLayout(saved)}
				>
					Restore
				</button>
			</div>

			<FlexiBoard
				onfirstcreate={(controller) => (board.current = controller)}
				className="size-72 rounded-b-xl border p-8 lg:size-96"
				config={boardConfig}
			>
				<FlexiTarget
					keyName="main"
					className="h-full w-full gap-4"
					containerClassName="h-full w-full"
					config={{
						rowSizing: 'minmax(0, 1fr)',
						layout: { type: 'free', minRows: 2, minColumns: 2, maxRows: 2, maxColumns: 2 }
					}}
				>
					<FlexiWidget type="tile" x={0} y={0} metadata={{ label: 'A' }} />
					<FlexiWidget type="tile" x={1} y={1} metadata={{ label: 'B' }} />
				</FlexiTarget>
			</FlexiBoard>
		</>
	);
}
```

</Only>

Save and Restore preserve each widget's ID and metadata. The renderer stays in your application; the saved `type` selects it from the registry when loading.

## The registry

A registry maps widget types to rendering configuration. It is required to reconstruct imported widgets. Exporting layout data does not require a registry.

A widget without a `type` is included in exports but skipped during import, with a warning. A typed widget needs a matching registry entry to recover its content. Register every type you intend to restore, and keep target identifiers stable.

The opening example registers `tile`. Registry entries can also define `component`, `componentProps`, `className`, interaction settings, and size limits. These options become defaults when creating a widget of that type. See [FlexiRegistryEntry](/docs/components/board#flexiregistryentry).

<Only svelte>

Use a Svelte component or a `snippet` to render a registry entry. The opening example's `label` snippet receives the widget controller.

</Only>

<Only react>

Use a React component or the registry entry's `snippet` render function. The `snippet` field receives the widget controller in its argument; it returns React content. The opening example uses the `Label` component and `useFlexiWidget()`.

</Only>

## Versioning what you store

`exportLayout()` returns a bare `FlexiLayout`. For storage, call `exportLayoutEnvelope()` to get `{ version, layout }`. `importLayout()` and `loadLayout` accept either form. The version identifies the stored format. The current importer unwraps the envelope without migrating it or rejecting unknown versions. Check the version in your storage code before importing data from a different format.

These helpers accept the controller from an existing board. Call `saveLayout` and `restoreLayout` from your application's buttons. They extend the registry and target setup in the opening example.

<Only svelte>

```ts
import type { FlexiBoardController } from '@flexiboards/svelte';

const storageKey = 'dashboard-layout';

export function saveLayout(board: FlexiBoardController) {
	localStorage.setItem(storageKey, JSON.stringify(board.exportLayoutEnvelope()));
}

export function restoreLayout(board: FlexiBoardController) {
	const saved = localStorage.getItem(storageKey);
	if (saved !== null) board.importLayout(JSON.parse(saved));
}
```

</Only>

<Only react>

```ts
import type { FlexiBoardController } from '@flexiboards/react';

const storageKey = 'dashboard-layout';

export function saveLayout(board: FlexiBoardController) {
	localStorage.setItem(storageKey, JSON.stringify(board.exportLayoutEnvelope()));
}

export function restoreLayout(board: FlexiBoardController) {
	const saved = localStorage.getItem(storageKey);
	if (saved !== null) board.importLayout(JSON.parse(saved));
}
```

</Only>

Malformed JSON throws during parsing. Decide whether your application should offer a reset or show an error. A TypeScript annotation does not validate stored data; validate data from untrusted sources before using its metadata in application actions.

## Creating widgets with types

Inside an existing target, declare a widget with `type="tile"` to select the `tile` registry entry. Add metadata such as `metadata={{ label: 'A' }}` to supply instance-specific content, as in the opening example.

`type` enables the registry lookup during import. It is not required to read a widget's position through export.

## Exporting layouts

Call `board.exportLayout()` when you need the bare layout for application logic. It maps target identifiers to arrays of widget entries. This illustrative JSON is a bare layout from a target named `main`:

```json
{
	"main": [
		{
			"id": "sales-chart",
			"type": "tile",
			"x": 0,
			"y": 0,
			"width": 1,
			"height": 1,
			"metadata": { "label": "Sales" }
		}
	]
}
```

Every exported entry has an `id`, supplied by you or generated by Flexiboards. Exporting only reads the layout and does not fire `onLayoutChange`.

For storage, use the [versioned helpers above](/docs/guides/exporting-importing-boards#versioning-what-you-store). For a responsive board, use the [responsive controller](/docs/guides/responsive-layouts#import-and-export), which stores the collection of breakpoint layouts.

## Importing layouts

Call `board.importLayout(saved)` with a bare layout or an envelope. Existing widgets in each target represented by the imported layout are cleared and replaced. The imported target identifiers must match your mounted targets. Entries without a type are skipped.

Import does not fire `onLayoutChange`. Loading a saved state therefore does not automatically save it again. Use the Restore button in the opening example to exercise this behavior.

## Loading on mount

Add `loadLayout` to the board configuration to restore client storage during initialization. It runs once when the board is ready on the client. It can return a bare layout, a versioned envelope, an array of widget entries for a single-target board, or `undefined` to keep the initial layout.

The following excerpt extends the opening example. Keep its registry and targets; add this property to the board's `config` object:

```ts
const persistenceOptions = {
	loadLayout: () => {
		const saved = localStorage.getItem('dashboard-layout');
		return saved === null ? undefined : JSON.parse(saved);
	}
};
```

Spread `persistenceOptions` into that configuration. `loadLayout` is skipped during SSR, so it can read browser storage. Changing the callback after initialization does not trigger another load; call `importLayout()` for an explicit reload.

## Initial layouts for server-rendered pages

Pass server-provided layout data as `initialLayout` on the board configuration. It seeds the first render in both frameworks. Keep the registry and target setup from the opening example and add `initialLayout: layout`, where `layout` is the `FlexiLayout` returned by your application.

Send the same initial layout to the server render and client hydration. The widget types resolve through the registry in both environments. See [Server-stored layouts](/docs/guides/server-side-rendering#server-stored-layouts) for framework-specific examples.

On a responsive board, use `initialLayouts`, keyed by breakpoint. If a client loader is also configured, the initial layout renders first and the loader can replace it on the client. See [Responsive layouts](/docs/guides/responsive-layouts).

## Auto-saving with onLayoutChange

Add both callbacks below to the existing board configuration, alongside its registry. `onLayoutChange` receives a bare layout. Wrap it with `LAYOUT_FORMAT_VERSION` when storing it so the saved value has the same envelope shape as `exportLayoutEnvelope()`.

<Only svelte>

```ts
import { LAYOUT_FORMAT_VERSION } from '@flexiboards/svelte';
import type { FlexiBoardConfiguration } from '@flexiboards/svelte';

const storageKey = 'dashboard-layout';

const persistenceOptions: Pick<FlexiBoardConfiguration, 'loadLayout' | 'onLayoutChange'> = {
	loadLayout: () => {
		const saved = localStorage.getItem(storageKey);
		return saved === null ? undefined : JSON.parse(saved);
	},
	onLayoutChange: (layout) => {
		localStorage.setItem(storageKey, JSON.stringify({ version: LAYOUT_FORMAT_VERSION, layout }));
	}
};
```

</Only>

<Only react>

```ts
import { LAYOUT_FORMAT_VERSION } from '@flexiboards/react';
import type { FlexiBoardConfiguration } from '@flexiboards/react';

const storageKey = 'dashboard-layout';

const persistenceOptions: Pick<FlexiBoardConfiguration, 'loadLayout' | 'onLayoutChange'> = {
	loadLayout: () => {
		const saved = localStorage.getItem(storageKey);
		return saved === null ? undefined : JSON.parse(saved);
	},
	onLayoutChange: (layout) => {
		localStorage.setItem(storageKey, JSON.stringify({ version: LAYOUT_FORMAT_VERSION, layout }));
	}
};
```

</Only>

Spread `persistenceOptions` into the board configuration in the opening example. The loader runs on the client. Layout notifications follow committed interactions and controller actions; synchronous changes are batched into one microtask, before animations settle.

Notifications include accepted drops and resizes, widget creation after initial loading, deletion, and programmatic moves or clears. Hover and validation callbacks are separate. Importing and exporting do not notify. See [Controller actions and callbacks](/docs/controllers#changing-the-board-from-code).

For remote storage, debounce writes if your application needs to limit requests. Keep the most recent layout while a save is pending and surface failed saves to the user.

## Widget IDs

Supply an `id` when a widget corresponds to a record in your application, for example `id="sales-chart"`. Flexiboards generates an ID when you omit it. Both supplied and generated IDs appear in exports and survive import.

Use unique, stable IDs to reconcile saved widgets with application records. The `id` and `type` props identify a widget when it is created; changing them later does not recreate it.

## Working with metadata

Metadata is per-widget JSON data carried through export and import. Use it for values such as a label, data-source key, or chart settings. Keep functions and component references in the registry.

The opening example writes `metadata={{ label: 'A' }}`. These widget-content examples read that label:

<Only svelte>

```svelte
<!-- label.svelte, rendered through a registry component entry -->
<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';
	const widget = getFlexiwidgetCtx();
</script>

<span>{String(widget.metadata?.label ?? '')}</span>
```

</Only>

<Only react>

```tsx
// label.tsx, rendered through a registry component entry
import { useFlexiWidget } from '@flexiboards/react';

export function Label() {
	const widget = useFlexiWidget();
	return <span>{String(widget.metadata?.label ?? '')}</span>;
}
```

</Only>

## Reference

The layout, entry, and registry types are listed on the [FlexiBoard page](/docs/components/board#flexilayout).
