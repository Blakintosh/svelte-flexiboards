---
title: Breaking Changes in v0.3
description: Information on the breaking changes that occurred in the v0.3 update.
category: Introduction
published: true
---

## FlexiDelete Changes
Prior to v0.3, the [FlexiDelete](/docs/components/deleter) did not use a controller, and it did not render any DOM element by itself.

In order to improve accessibility, this was changed, and the `FlexiDelete` component now renders a `div` that wraps the `children` content. This has led to the following breaking changes:

- `props` property passed to the `children` snippet (with members `onpointerenter` and `onpointerleave`) is now redundant. You can delete these, as they will be removed in the next version.
- You may now need to style around the addition of the wrapper `div`. A `class` prop has been added to let you do this.
- The contents of your `children` snippet no longer needs to be hoverable.