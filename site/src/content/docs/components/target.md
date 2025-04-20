---
title: FlexiTarget
description: A 'target' for widgets, or a dropzone. Stores a series of widget instances in a managed grid layout.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
</script>

## FlexiTarget (component)

<ApiReference title="Props" api={[
{
name: "header",
type: "Snippet<[{ target: FlexiTargetController }]>",
description: "The header content of the target, above the grid."
},
{
name: "children",
type: "Snippet",
description: "The child content of the target, which should contain inner FlexiWidget definitions."
},
{
name: "footer",
type: "Snippet<[{ target: FlexiTargetController }]>",
description: "The footer content of the target, below the grid."
},
{
name: "containerClass",
type: "string",
description: "The class names to apply to the target's container element."
},
{
name: "class",
type: "string",
description: "The class names to apply to the target's root element."
},
{
name: "config",
type: "FlexiTargetConfiguration",
description: "The configuration object for the target."
},
{
name: "key",
type: "string",
description: "The unique identifier for the target. Used to identify the target when layouts are imported or exported."
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

## FlexiTargetController

`FlexiTargetController` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiTargetController` allows you to manage the target directly and carry out actions.

<ApiReference title="Properties" api={[
{
name: "widgets",
type: "SvelteSet<FlexiWidgetController>",
description: "The widgets currently in this target."
},
{
name: "config",
type: "FlexiTargetConfiguration",
description: "The reactive configuration of the target."
},
{
name: "providerWidgetDefaults",
type: "FlexiWidgetDefaults | undefined",
description: "The reactive default widget configuration passed through from the provider, if it exists."
},
{
name: "prepared",
type: "boolean",
description: "Whether the target is prepared and ready to render widgets."
}
]} />

<ApiReference title="Methods" api={[
{
name: "createWidget",
type: "(config: FlexiWidgetConfiguration) => FlexiWidgetController | undefined",
description: "Creates a new widget under this target."
},
{
name: "deleteWidget",
type: "(widget: FlexiWidgetController) => boolean",
description: "Deletes the given widget from this target, if it exists."
},
{
name: "restorePreGrabSnapshot",
type: "() => void",
description: "Restores the target to its pre-grab state. This is not intended for external use."
},
{
name: "forgetPreGrabSnapshot",
type: "() => void",
description: "Forgets the pre-grab state of the target. This is not intended for external use."
},
{
name: "dropWidget",
type: "(widget: FlexiWidgetController) => boolean",
description: "Attempts to drop a widget into this target."
},
{
name: "grabWidget",
type: "(params: WidgetGrabbedParams) => WidgetAction | null",
description: "Grabs a widget."
},
{
name: "startResizeWidget",
type: "(params: WidgetStartResizeParams) => WidgetAction | null",
description: "Starts resizing a widget."
}
]} />

## FlexiTargetConfiguration

The configuration object for the `FlexiTarget` component, which supports reactivity where specified.

To use reactivity, ensure that the `config` prop has a reactive source (proxy).

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
},
{
name: "widgetDefaults",
type: "FlexiWidgetDefaults",
description: "The default configuration for widgets. Reactive."
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
