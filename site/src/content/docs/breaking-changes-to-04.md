---
title: Breaking changes in v0.4
description: The breaking changes in the v0.4 update.
category: Introduction
published: true
framework: svelte
---

_Applies to `svelte-flexiboards` v0.4.0, released 7 February 2026. This page is kept for reference; new projects should install `@flexiboards/svelte` and follow [Migrating to v1.0](/docs/breaking-changes-to-10)._

## 1. Draggability

In place of the `draggable` boolean property, we've introduced a `draggability` enum (values `none`, `movable`, `full`) for finer control over widget movability.

- `none` is equivalent to `draggable = false`. The widget is completely fixed in place.
- `full` is equivalent to `draggable = true`. The widget can be grabbed by the user and moved by other widget actions.
- `movable` is a new value. You cannot grab a widget and move it yourself, but other widget actions can still move it.

In v0.4, `draggable` is deprecated. It was removed in v1.0; use `draggability` when [migrating to v1.0](/docs/breaking-changes-to-10#removed).

## 2. Widget defaults

We're removing the `width` and `height` properties from `FlexiWidgetDefaults`. These properties have never functioned, and we have not found a use-case worth making them work for.

In v0.4, `width` and `height` on `widgetDefaults` are deprecated. They were removed in v1.0. Set dimensions on individual widgets.
