---
title: FlexiAdd
description: A component that allows you to drag in new widgets into a board.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import HeadsUp from '$lib/components/docs/heads-up.svelte';
</script>

<HeadsUp title="Breaking Change Notice">
    In order to make FlexiAdd more accessible, we now create a wrapper button around the FlexiAdd component. Previously, the user was responsible for creating such an element.

    You can style the FlexiAdd div using the new `class` prop.

    Please note that the `props` snippet property containing the `onpointerdown` and `style` props is now deprecated and will be removed in v0.4. They are currently maintained as empty props for compatibility purposes.

    See [Breaking Changes in v0.3](/docs/breaking-changes-to-03) for more details.

</HeadsUp>

## FlexiAdd (component)

<ApiReference title="Props" api={[
{
name: "children",
type: "Snippet<[{ adder: FlexiAddController }]>",
description: "The child content of the adder, containing the contents of the adder button."
},
{
name: "class",
type: "FlexiAddClasses",
description: "The class names to apply to the adder's button element."
},
{
name: "addWidget",
type: "() => AdderWidgetConfiguration",
description: "When the user interacts with the adder, this function allows you to specify the configuration of the widget that is created and grabbed."
},
{
name: "controller",
type: "FlexiAddController (bindable)",
description: "The controller for the adder."
},
{
name: "onfirstcreate",
type: "(controller: FlexiAddController) => void",
description: "A callback that fires when the adder's controller is first created."
}
]} />

## FlexiAddController

`FlexiAdd` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiAddController` allows you to manage the board directly and carry out actions.

<ApiReference title="Properties" api={[
{
name: "newWidget",
type: "FlexiWidgetController | undefined",
description: "The widget that is currently being dragged in."
}
]} />

## AdderWidgetConfiguration

`AdderWidgetConfiguration` allows you to specify the configuration of the widget that is created and grabbed, as well as the initial width and height that the grabbed widget will have.

<ApiReference title="Properties" api={[
{
name: "widget",
type: "FlexiWidgetConfiguration",
description: "The configuration of the widget that is created and grabbed."
},
{
name: "widthPx",
type: "number",
description: "The initial width of the grabbed widget in pixels."
},
{
name: "heightPx",
type: "number",
description: "The initial height of the grabbed widget in pixels."
}
]} />
