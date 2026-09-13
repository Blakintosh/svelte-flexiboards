---
title: Changelog
description: What changed in each release of Flexiboards, newest first.
category: Introduction
published: true
---

Dates are the npm publish dates. Breaking changes link to their migration page.

## 1.0.0 (2026-09-13)

The first release of the split packages: `@flexiboards/core` holds the grid engine, `@flexiboards/svelte` and `@flexiboards/react` are adapters over it with mirrored APIs. `svelte-flexiboards` stops at 0.4.2. See [Migrating to v1.0](/docs/breaking-changes-to-10).

Added

- React adapter with the same components, hooks in place of context getters, `onfirstcreate` in place of `bind:controller`, a `suspense` prop, and `renderToString` support. `FlexiBoard` forwards `ref` to its root element.
- Controller actions: `widget.delete()`, `widget.moveTo()`, `target.clear()`, `board.clear()`, `exportLayoutEnvelope()`. `onLayoutChange` reports layout mutations; exporting an envelope only reads the layout.
- Board callbacks `onWidgetGrab`, `onWidgetDrop`, `onWidgetResize`, `onWidgetCancel`, `onWidgetDelete`, `onWidgetEnterTarget`, `onWidgetLeaveTarget`, and `canDrop` on the board and on each target.
- Presets `FlexiSortable` and `FlexiDashboard`.
- `FlexiWidget` declarations can mount after their target has loaded, using the same placement rules as `createWidget()`.
- CSS motion uses sine in-out reordering and circ-out drops. The deprecated `simpleTransitionConfig()` keeps its original 150ms timing. Registry component families enable transitions by default and respect reduced motion.
- Animation adapters: `cssTransition()` and `spring()`, with `cssTransitionConfig()` and `springTransitionConfig()`.
- Layout callbacks run after a drop is committed, before animations settle. Destination placeholders use the final card size, including when text wraps differently between columns.
- The spring preset responds faster with less bounce. Core springs follow the same path across frame rates, including at 30fps.
- Sortable-style insert resolution for flow grids, and `portalDropFlights` for boards that need a drop to fly in across their edge.
- `dropRejected` state on targets and widgets; `initialLayout` for server-provided layouts; layouts loaded on the client can show a `suspense` fallback.
- Every exported layout entry carries an `id`; layouts can be stored as a `{ version, layout }` envelope.
- `FlexiGrab` and `FlexiResize` components; class functions on both.
- Markdown twins of every docs page, `/llms.txt`, and a skill for AI assistants.

Fixed

- Grid cells now belong to rows and expose one-based ARIA indices. Drag previews are hidden and inert, and keyboard focus is preserved across targets.
- React StrictMode could disconnect the live announcer from the board. Nested button activation no longer grabs the surrounding widget.
- A drop's flight aimed at where its slot used to be before the grid reflowed, and, in nested boards, started from the wrong place.
- A flow column kept an empty row after a card was dragged out of it.
- A keyboard grab that jumped the pointer into another target never got a drop preview there.
- Widgets with `draggability: 'none'` were still focusable and marked droppable.
- Target sizing changes made after mount did not restyle the grid.

Removed

- The `draggable` boolean and the `width`/`height` keys of `widgetDefaults`.

## 0.4.2 (2026-06-10)

- Text inside widgets can be selected again: pointer events are no longer prevented unconditionally.
- Drag behaviour fixes and a tidier boundary between internal and public controllers.

## 0.4.1 (2026-04-06)

- Widget positions were tracked incorrectly while the board was scrolled, during both grabs and resizes.
- The "View source" links on the examples now point at the examples folder.

## 0.4.0 (2026-02-07)

See [Breaking Changes in v0.4](/docs/breaking-changes-to-04).

- Layout import and export, and `ResponsiveFlexiBoard` with per-breakpoint layouts.
- Scrollable boards, with scrollbar compensation during drags so the layout does not shift.
- Resizing on flow grids, and improved placement logic for them.
- Interpolation fixes for shrinking and resizing widgets.
- The products example.

## 0.3.2 (2025-09-01)

See [Breaking Changes in v0.3](/docs/breaking-changes-to-03). The last release of the 0.3 line.
