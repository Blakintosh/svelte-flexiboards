---
title: Breaking Changes in v0.3
description: Information on the breaking changes that occurred in the v0.3 update.
category: Introduction
published: true
---

_Applies to `svelte-flexiboards` v0.3.0, released 27 August 2025. This page is kept for reference; new projects should install `@flexiboards/svelte` and follow [Migrating to v1.0](/docs/breaking-changes-to-10)._

## 1. FlexiDelete changes

Prior to v0.3, the [FlexiDelete](/docs/components/deleter) did not use a controller, and it did not render any DOM element by itself.

To improve accessibility, we changed that: the `FlexiDelete` component now renders a `div` that wraps the `children` content. This has led to the following breaking changes:

- `props` property passed to the `children` snippet (with members `onpointerenter` and `onpointerleave`) is now redundant. You can delete these, as they will be removed in the next version.
- You may now need to style around the addition of the wrapper `div`. A `class` prop has been added to let you do this.
- The contents of your `children` snippet no longer needs to be hoverable.
- Where no label is provided inside of the deleter, we recommend that you have a screen-reader only `span` (e.g. class `sr-only` in TailwindCSS) inside of the `children` snippet to provide a descriptive label.

The [Numbers](/examples/numbers) example has been updated to reflect this change.

## 2. FlexiAdd changes

For the same reason, the [FlexiAdd](/docs/components/adder) now renders its own button element, with the `children` content inside it. This means:

- `props` is now redundant inside of the snippet (with members `onpointerdown` and `style`), and you do not need to spread them. You can remove this.
- You may now need to style around the addition of the wrapper `button`. A `class` prop has been added to let you do this.
- The contents of your `children` snippet no longer needs to be a button.

The [Numbers](/examples/numbers) example has been updated to reflect this change.

## 3. Internal controller changes

Earlier releases let controllers, especially the `FlexiWidgetController`, expose methods and properties that were never intended for external use. In v0.3, those methods are no longer available.
