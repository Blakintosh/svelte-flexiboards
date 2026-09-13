---
title: Migrating to v1.0
description: What changed in Flexiboards 1.0, and how to move a v0.4 project across.
category: Introduction
published: true
framework: svelte
---

<script lang="ts">
	import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

_Applies to Flexiboards 1.0.0, September 2026. Migrating from v0.3 or earlier? Apply [v0.4](/docs/breaking-changes-to-04) first._

## What changed and why

Flexiboards 1.0 splits the library into a framework-agnostic core and thin adapters, so the React port shares one engine with Svelte. For a Svelte project the public API is unchanged apart from the package name. The rest of this page lists what you can now remove or rename.

## Renamed packages

| v0.4                 | v1.0                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `svelte-flexiboards` | `@flexiboards/svelte`                                                |
| Not in v0.4          | `@flexiboards/react` (new)                                           |
| Not in v0.4          | `@flexiboards/core` (types and helpers, re-exported by each adapter) |

<InstallCommand steps={[{ action: 'remove', package: 'svelte-flexiboards' }, { package: '@flexiboards/svelte' }]} />

Then replace the import specifier:

```diff
- import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
+ import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
```

Every export from v0.4 is still exported from `@flexiboards/svelte` under the same name.

## Changed helpers

| v0.4                       | v1.0                    | Notes                                                               |
| -------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `simpleTransitionConfig()` | `cssTransitionConfig()` | The old helper is deprecated and retains its original 150ms easing. |

## Deprecations still honoured

- `simpleTransitionConfig()` retains the original 150ms preset. `cssTransitionConfig()` now uses sine in-out moves and circ-out drops.

## Removed

- `draggable` on widgets and in `widgetDefaults`, deprecated since v0.4. Use `draggability`: `'full'` for `true`, `'none'` for `false`, or `'movable'` for a widget other widgets may push but the user cannot grab. The controller's `draggable` getter stays, read-only, as shorthand for `draggability !== 'none'`.
- `width` and `height` in `widgetDefaults`. They never had an effect, so nothing changes at runtime; if you set them, TypeScript now flags the keys. Set `width` and `height` on each widget instead.

## The `svelte-flexiboards` package

`svelte-flexiboards` stops at 0.4.2. It stays on npm and keeps working, but it receives no further releases; every fix and feature from here lands in `@flexiboards/svelte`.

## New in v1.0

### Controller actions and interaction callbacks

You can change a board from its controllers:

- Call `delete()` or `moveTo()` on a widget.
- Call `clear()` on a target or board.

`onLayoutChange` now also reports changes made through these methods and `createWidget()`. It runs in a microtask before animations settle, batching changes made in the same turn. Debounce your save handler if you need to limit writes to storage.

The board configuration adds callbacks for each interaction:

- `onWidgetGrab`, `onWidgetDrop`, and `onWidgetCancel` track a drag.
- `onWidgetResize` reports a committed resize; `onWidgetDelete` reports a deletion.
- `onWidgetEnterTarget` and `onWidgetLeaveTarget` track movement between targets.

Use `canDrop` on the board or an individual target to reject a placement. See [Controllers](/docs/controllers#changing-the-board-from-code).

### Layout exports

- Every exported widget has an `id`.
- `exportLayoutEnvelope()` includes a format version alongside the layout for storage.
- Widgets without a `type` are now included in exports. `FlexiWidgetLayoutEntry.type` is optional, so code that reads it must handle `undefined`.

### Component behavior

In React, `FlexiBoard` forwards `ref` to its root element.

In both frameworks, you can mount new `FlexiWidget` declarations after the target has loaded. Each one is added through the existing placement rules. A placement that cannot fit is rejected with a warning. See [Adding widgets later](/docs/components/widget#adding-widgets-later).

### Other additions

- `springTransitionConfig()`, and the `spring()` and `cssTransition()` animation adapters. See [Transitions](/docs/transitions).
- `initialLayout` and the `suspense` snippet for server-rendered boards. See [Server-Side Rendering](/docs/guides/server-side-rendering).
- `packing` on free-form layouts. See [Free-Form Grids](/docs/free-form-grids).
- `dropRejected` on widget and target controllers. See [Widget Rendering](/docs/widget-rendering#styling-by-state).
