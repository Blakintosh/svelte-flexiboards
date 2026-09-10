---
title: Breaking Changes in v0.4
description: Information on the breaking changes that occurred in the v0.4 update.
category: Introduction
published: true
---

_Applies to `svelte-flexiboards` v0.4.0, released 7 February 2026. This page is kept for reference; new projects should install `@flexiboards/svelte` and follow [Migrating to v1.0](/docs/breaking-changes-to-10)._

## 1. Draggability

In place of the `draggable` boolean property, we've introduced a `draggability` enum (values `none`, `movable`, `full`) that gives you finer control over widget movability. 
- `none` is equivalent to `draggable = false`. The widget is completely fixed in place.
- `full` is equivalent to `draggable = true`. The widget can be grabbed by the user and moved by other widget actions.
- `movable` is a new value. You cannot grab a widget and move it yourself, but other widget actions can still move it.

The `draggable` property is deprecated. It still works in v1.0 and will be removed in the next major version.

## 2. Widget defaults

We're removing the `width` and `height` properties from `FlexiWidgetDefaults`. These properties have never functioned, and we have not found a use-case worth making them work for.

The `width` and `height` properties on `widgetDefaults` are deprecated. They still exist in v1.0 and will be removed in the next major version.