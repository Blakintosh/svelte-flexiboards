---
title: Breaking Changes in v0.4
description: Information on the breaking changes that occurred in the v0.4 update.
category: Introduction
published: true
---

## 1. Draggability

Instead of just using the `draggable` boolean property, we've introduced a `draggability` enum (values `none`, `movable`, `full`) to add finer control to widget movability. 
- `none` is equivalent to `draggable = false`. The widget is completely fixed in place.
- `full` is equivalent to `draggable = true`. The widget can be grabbed by the user and moved by other widget actions.
- `movable` is a new value which makes it so that you cannot grab a widget and move it, but it can be moved by other widget actions.

The `draggable` property is now deprecated and will be removed in Flexiboards v1.0.

## 2. Widget Defaults

We're removing the `width` and `height` properties from `FlexiWidgetDefaults`. These properties have never functioned, and there does not appear to be a valuable use-case to make them function.

The `width` and `height` properties are now deprecated and will be removed in Flexiboards v1.0.