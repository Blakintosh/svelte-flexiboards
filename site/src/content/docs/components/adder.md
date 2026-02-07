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

<ApiReference title="Properties" api={[
{
name: "ref",
type: "HTMLElement | undefined",
description: ""
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
