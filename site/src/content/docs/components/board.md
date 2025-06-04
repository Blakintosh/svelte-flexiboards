---
title: FlexiBoard
description: The main container component of a board, managing the targets and widgets within it.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
</script>

## FlexiBoard (component)

<ApiReference title="Props" api={[
{
name: "config",
type: "FlexiBoardConfiguration",
description: "The configuration object for the board."
},
{
name: "class",
type: "ClassValue",
description: "The class to apply to the board."
},
{
name: "children",
type: "Snippet",
description: "The child content of the board, which should contain the inner FlexiTarget and FlexiWidget components."
},
{
name: "controller",
type: "FlexiBoardController (bindable)",
description: "The controller for the board."
},
{
name: "onfirstcreate",
type: "(controller: FlexiBoardController) => void",
description: "A callback that fires when the board's controller is first created."
}
]} />

## FlexiBoardController

`FlexiBoard` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiBoardController` allows you to manage the board directly and carry out actions.

<ApiReference title="Properties" api={[
{
name: "style",
type: "string",
description: "The reactive styling to apply to the board's root element."
},
{
name: "ref",
type: "HTMLElement | null",
description: "The reactive DOM reference to the board's root element."
}
]} />

<ApiReference title="Methods" api={[
{
name: "moveWidget",
type: "(widget: FlexiWidgetController, from: FlexiTargetController | undefined, to: FlexiTargetController) => void",
description: "Moves an existing widget from one target to another."
}
]} />

## FlexiBoardConfiguration

The configuration object for the `FlexiBoard` component, which supports reactivity where specified.

To use reactivity, ensure that the `config` prop has a reactive source (proxy).

<ApiReference title="Properties" api={[
{
name: "widgetDefaults",
type: "FlexiWidgetDefaults",
description: "The default configuration for widgets. Reactive."
},
{
name: "targetDefaults",
type: "FlexiTargetDefaults",
description: "The default configuration for targets. Reactive."
}
]} />

### FlexiTargetDefaults

The default configuration for targets.

<ApiReference title="Properties" api={[
{
name: "rowSizing",
type: "string | ({ target, grid }: { target: FlexiTargetController, grid: FlexiGrid }) => string",
description: "Allows the specifying of the value inside the `repeat()` function of the `grid-template-rows` CSS property for the target. Defaults to 'minmax(1rem, auto)'. Reactive."
},
{
name: "columnSizing",
type: "string | ({ target, grid }: { target: FlexiTargetController, grid: FlexiGrid }) => string",
description: "Allows the specifying of the value inside the `repeat()` function of the `grid-template-columns` CSS property for the target. Defaults to 'minmax(0, 1fr)'. Reactive."
},
{
name: "baseColumns",
type: "number",
description: "The base number of columns for the target's grid. Defaults to 1. Not reactive."
},
{
name: "baseRows",
type: "number",
description: "The base number of rows for the target's grid. Defaults to 1. Not reactive."
},
{
name: "layout",
type: "TargetLayout",
description: "The layout algorithm and parameters to use for the target grid. Reactive."
}
]} />

### FlexiWidgetDefaults

The default configuration for widgets.

<ApiReference title="Properties" api={[
{
name: "draggable",
type: "boolean",
description: "Whether the widget is draggable. Defaults to true. Reactive."
},
{
name: "resizability",
type: "'none' | 'horizontal' | 'vertical' | 'both'",
description: "The resizability of the widget. Defaults to 'both'. Reactive."
},
{
name: "width",
type: "number",
description: "The width of the widget in units. Defaults to 1. Not reactive."
},
{
name: "height",
type: "number",
description: "The height of the widget in units. Defaults to 1. Not reactive."
},
{
name: "snippet",
type: "Snippet",
description: "The snippet that is rendered by this widget. Reactive."
},
{
name: "component",
type: "Component",
description: "The component that is rendered by this widget. Reactive."
},
{
name: "componentProps",
type: "Record<string, any>",
description: "The props applied to the component rendered, if it has one. Reactive."
},
{
name: "className",
type: "ClassValue",
description: "The class names to apply to this widget. Reactive."
}
]} />
