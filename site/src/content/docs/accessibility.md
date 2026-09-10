---
title: Accessibility
description: What Flexiboards does for keyboard and screen-reader users, and what your markup needs to add.
category: Introduction
published: true
---

## What the library provides

Flexiboards renders semantic roles and live announcements without any configuration:

- The board is a `role="application"` region, described by a hidden instructions element and marked `aria-busy` while a layout is [pending](/docs/guides/server-side-rendering).
- Each target's grid is `role="grid"` with `aria-colcount` and `aria-rowcount`.
- Each widget is `role="cell"` with `aria-colindex`, `aria-rowindex`, `aria-colspan`, `aria-rowspan`, and `aria-grabbed` while held.
- A visually hidden `aria-live` announcer inside the board reports grabs, resizes, releases, and rejected drops.

## Keyboard

A widget that can be grabbed is in the tab order. If it contains a [FlexiGrab](/docs/components/grab), the handle takes its place in the tab order instead, and [FlexiResize](/docs/components/resize) handles are always focusable buttons.

| Key | On | Effect |
| --- | --- | --- |
| <kbd>Tab</kbd> | Page | Moves focus between widgets, grab handles, resize handles, and adders. |
| <kbd>Enter</kbd> | Focused widget or grab handle | Grabs the widget from its centre. |
| <kbd>Enter</kbd> | Focused resize handle | Starts resizing the widget. |
| <kbd>Enter</kbd> | Focused adder | Creates the adder's widget and grabs it. |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | While grabbed or resizing | Moves the widget, or its resize edge, by a small step. Hold <kbd>Shift</kbd> for a large step, or <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> for a fine one. |
| <kbd>Enter</kbd> | Anywhere, while grabbed or resizing | Drops the widget where it currently is. |
| <kbd>Escape</kbd> | Anywhere, while grabbed or resizing | Cancels and returns the widget to where it started. |

A keyboard grab drives the same virtual pointer as a mouse drag, so the widget follows the arrow keys across cells and between targets exactly as it would follow a cursor. <kbd>Tab</kbd> is trapped while a widget is held, so focus cannot leave until you drop or cancel.

## What you need to add

- **Label handles and adders.** `FlexiGrab`, `FlexiResize`, `FlexiAdd`, and `FlexiDelete` render their own elements but not their own text. Put a visually hidden `span` inside icon-only content.
- **Make state visible.** The `isGrabbed`, `isShadow`, `isResizing`, and `dropRejected` flags on the widget controller are yours to style; the library only announces them. See [Widget Rendering](/docs/widget-rendering#styling-by-state).
- **Respect reduced motion.** Flexiboards transitions move and resize widgets, which is the kind of motion `prefers-reduced-motion` asks you to remove. When it is set, leave `transition` out of the configuration so widgets snap into place. Opacity and colour changes in your own widget styling can stay; the preference is about movement, not every animation.
- **Keep custom content operable.** Buttons and links inside a widget keep working while the widget is draggable, but on touch devices a full-widget drag competes with scrolling. Prefer a grab handle, or the `longPressTriggerConfig()` grab trigger, where widgets contain interactive content.
