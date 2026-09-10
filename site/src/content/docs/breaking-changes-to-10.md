---
title: Migrating to v1.0
description: What changed in Flexiboards 1.0, and how to move a v0.4 project across.
category: Introduction
published: true
---

<script lang="ts">
	import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

_Applies to Flexiboards 1.0.0, September 2026. Migrating from v0.3 or earlier? Apply [v0.4](/docs/breaking-changes-to-04) first._

## What changed and why

Flexiboards 1.0 splits the library into a framework-agnostic core and thin adapters, so the React port shares one engine with Svelte. For a Svelte project the public API is unchanged apart from the package name. The rest of this page lists what you can now remove or rename.

## Renamed packages

| v0.4 | v1.0 |
| --- | --- |
| `svelte-flexiboards` | `@flexiboards/svelte` |
| Not in v0.4 | `@flexiboards/react` (new) |
| Not in v0.4 | `@flexiboards/core` (types and helpers, re-exported by each adapter) |

<InstallCommand steps={[{ action: 'remove', package: 'svelte-flexiboards' }, { package: '@flexiboards/svelte' }]} />

Then replace the import specifier:

```diff
- import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
+ import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
```

Every export from v0.4 is still exported from `@flexiboards/svelte` under the same name.

## Renamed helpers

| v0.4 | v1.0 | Notes |
| --- | --- | --- |
| `simpleTransitionConfig()` | `cssTransitionConfig()` | The old name still works as a deprecated alias. |

## Deprecations still honoured

- `simpleTransitionConfig()` remains as an alias of `cssTransitionConfig()`.

## Removed

- `draggable` on widgets and in `widgetDefaults`, deprecated since v0.4. Use `draggability`: `'full'` for `true`, `'none'` for `false`, or `'movable'` for a widget other widgets may push but the user cannot grab. The controller's `draggable` getter stays, read-only, as shorthand for `draggability !== 'none'`.
- `width` and `height` in `widgetDefaults`. They never had an effect, so nothing changes at runtime; if you set them, TypeScript now flags the keys. Set `width` and `height` on each widget instead.

## The `svelte-flexiboards` package

`svelte-flexiboards` stops at 0.4.2. It stays on npm and keeps working, but it receives no further releases; every fix and feature from here lands in `@flexiboards/svelte`.

## New in v1.0

### Controller actions and interaction callbacks

Widgets gained `delete()` and `moveTo()`, targets and boards gained `clear()`, and `onLayoutChange` now also fires for changes made through these calls and `createWidget()`. The board configuration takes `onWidgetGrab`, `onWidgetDrop`, `onWidgetResize`, `onWidgetCancel`, `onWidgetDelete`, `onWidgetEnterTarget`, `onWidgetLeaveTarget` and `canDrop`; a target configuration takes its own `canDrop`. Exported entries always carry an `id`, and `exportLayoutEnvelope()` adds a format version for storage. In React, `FlexiBoard` forwards `ref` to its root element, and a `FlexiWidget` declared after its target has loaded now logs a warning instead of being ignored silently. See [Controllers](/docs/controllers#changing-the-board-from-code). Exported layouts now include widgets that have no `type` (previously they were skipped with a warning), so `FlexiWidgetLayoutEntry.type` is optional; code that reads it should handle `undefined`.

Nothing here requires a change, but these are the additions a v0.4 project is most likely to want:

- `springTransitionConfig()`, and the `spring()` and `cssTransition()` animation adapters. See [Transitions](/docs/transitions).
- `initialLayout` and the `suspense` snippet for server-rendered boards. See [Server-Side Rendering](/docs/guides/server-side-rendering).
- `packing` on free-form layouts. See [Free-Form Grids](/docs/free-form-grids).
- `dropRejected` on widget and target controllers. See [Widget Rendering](/docs/widget-rendering#styling-by-state).
