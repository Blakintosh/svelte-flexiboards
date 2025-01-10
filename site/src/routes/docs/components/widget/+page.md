<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
</script>

# FlexiWidget

A widget is a component (such as a tile) that is stored within a target (dropzone). Widgets can be moved around within a target or between targets.

## FlexiWidget (component)

<ApiReference title="Props" api={[
{
name: "class",
type: "string",
description: "The class names to apply to this widget."
},
{
name: "children",
type: "Snippet<[{ widget: FlexiWidgetController, component?: Component, componentProps?: Record<string, any> }]>",
description: "The content rendered within the widget."
},
{
name: "draggable",
type: "boolean",
description: "Whether the widget is draggable."
},
{
name: "resizability",
type: "'none' | 'horizontal' | 'vertical' | 'both'",
description: "The resizability of the widget."
},
{
name: "width",
type: "number",
description: "The width of the widget in units."
},
{
name: "height",
type: "number",
description: "The height of the widget in units."
},
{
name: "component",
type: "Component<T>",
description: "The component rendered within the widget."
},
{
name: "componentProps",
type: "T",
description: "The props applied to the component rendered, if it has one."
},
{
name: "controller",
type: "FlexiWidgetController (bindable)",
description: "The controller for this widget."
},
{
name: "onfirstcreate",
type: "(controller: FlexiWidgetController) => void",
description: "A callback that fires when the widget's controller is first created."
}
]} />

## FlexiWidgetController

`FlexiWidgetController` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiWidgetController` allows you to manage the widget directly and carry out actions.

<ApiReference title="Properties" api={[
{
name: "target",
type: "FlexiTargetController | undefined",
description: "The target this widget is under, if any."
},
{
name: "adder",
type: "FlexiAddController | undefined",
description: "The adder this widget is currently being created under, if any."
},
{
name: "ref",
type: "HTMLElement | undefined",
description: "The DOM element bound to this widget."
},
{
name: "config",
type: "FlexiWidgetDerivedConfiguration",
description: "The reactive configuration of the widget."
},
{
name: "isShadow",
type: "boolean",
description: "Whether this widget is a shadow dropzone widget."
},
{
name: "isGrabbed",
type: "boolean",
description: "Whether this widget is grabbed."
},
{
name: "isResizing",
type: "boolean",
description: "Whether this widget is being resized."
},
{
name: "style",
type: "string",
description: "The styling to apply to the widget."
},
{
name: "currentAction",
type: "WidgetAction | null",
description: "The current action being performed on the widget."
},
{
name: "draggable",
type: "boolean",
description: "Whether the widget is draggable."
},
{
name: "resizability",
type: "'none' | 'horizontal' | 'vertical' | 'both'",
description: "The resizability of the widget."
},
{
name: "width",
type: "number",
description: "The width of the widget in units."
},
{
name: "height",
type: "number",
description: "The height of the widget in units."
},
{
name: "component",
type: "Component | undefined",
description: "The component rendered within the widget."
},
{
name: "componentProps",
type: "Record<string, any> | undefined",
description: "The props applied to the component rendered, if it has one."
},
{
name: "snippet",
type: "Snippet<[{ widget: FlexiWidgetController, component?: Component, componentProps?: Record<string, any> }]> | undefined",
description: "The content rendered within the widget."
},
{
name: "className",
type: "ClassValue | undefined",
description: "The class name that is applied to this widget."
},
{
name: "x",
type: "number",
description: "The column (x-coordinate) of the widget."
},
{
name: "y",
type: "number",
description: "The row (y-coordinate) of the widget."
},
{
name: "metadata",
type: "Record<string, any> | undefined",
description: "The metadata associated with this widget, if any."
}
]} />

<ApiReference title="Methods" api={[
{
name: "onpointerdown",
type: "(event: PointerEvent) => void",
description: "Event handler for when the widget receives a pointerdown event."
},
{
name: "ongrabberpointerdown",
type: "(event: PointerEvent) => void",
description: "Event handler for when one of the widget's grabbers receives a pointerdown event."
},
{
name: "onresizerpointerdown",
type: "(event: PointerEvent) => void",
description: "Event handler for when one of the widget's resizers receives a pointerdown event."
},
{
name: "setBounds",
type: "(x: number, y: number, width: number, height: number) => void",
description: "Sets the bounds of the widget. This is not intended for use externally."
},
{
name: "addGrabber",
type: "() => { onpointerdown: (event: PointerEvent) => void }",
description: "Registers a grabber to the widget and returns an object with an `onpointerdown` event handler."
},
{
name: "removeGrabber",
type: "() => void",
description: "Unregisters a grabber from the widget."
},
{
name: "addResizer",
type: "() => { onpointerdown: (event: PointerEvent) => void }",
description: "Registers a resizer to the widget and returns an object with an `onpointerdown` event handler."
},
{
name: "removeResizer",
type: "() => void",
description: "Unregisters a resizer from the widget."
},
{
name: "delete",
type: "() => void",
description: "Deletes this widget from its target and board."
}
]} />

## FlexiWidgetConfiguration

The configuration object for the `FlexiWidget` component. This is not reactive when invoked as props on the component, so to mutate it reactively you will need to mutate properties on the controller.

<ApiReference title="Properties" api={[
{
name: "draggable",
type: "boolean",
description: "Whether the widget is draggable. Defaults to true. Reactive property."
},
{
name: "resizability",
type: "'none' | 'horizontal' | 'vertical' | 'both'",
description: "The resizability of the widget. Defaults to 'both'. Reactive property."
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
description: "The snippet that is rendered by this widget. Reactive property."
},
{
name: "component",
type: "Component",
description: "The component that is rendered by this widget. Reactive property."
},
{
name: "componentProps",
type: "Record<string, any>",
description: "The props applied to the component rendered, if it has one. Reactive property."
},
{
name: "className",
type: "ClassValue",
description: "The class names to apply to this widget. Reactive property."
},
{
name: "x",
type: "number",
description: "The column (x-coordinate) of the widget. Not reactive."
},
{
name: "y",
type: "number",
description: "The row (y-coordinate) of the widget. Not reactive."
},
{
name: "metadata",
type: "Record<string, any>",
description: "The metadata associated with this widget, if any. Reactive property."
}
]} />
