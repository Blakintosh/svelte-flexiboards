---
title: Transitions
description: Animate your Flexiboard components with CSS transitions.
category: Guides
published: true
---

## Introduction

Being a headless library, a default Flexiboard does not animate the movement of widgets.

However, manually adding transitions outside of the library would be tricky. CSS transitions do not animate when `grid-row` and `grid-column` values change, which Flexiboards uses under the hood to position placed widgets.

In order to solve this, Flexiboards has a built-in system that allows you to animate the movement of widgets with CSS transitions.

## How it works

On a FlexiWidget's configuration (or the defaults of a FlexiTarget or FlexiBoard), you can specify a `transition` property.

This property is an object that can contain the following properties:

- `duration`: The duration of the transition in milliseconds.
- `easing`: The easing function to use for the transition. This can be any valid CSS easing function, including `cubic-bezier()`.

When not specified, no transition will be applied.

## Example
