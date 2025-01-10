<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';

    $effect(() => {
        document.title = 'FlexiAdd ⋅ Component Docs ⋅ Flexiboards';
    });
</script>

# FlexiAdd

A component that allows you to drag in new widgets into a board.

## FlexiAdd (component)

<ApiReference title="Props" api={[
{
name: "children",
type: "Snippet<[{ adder: FlexiAddController; props: FlexiAddChildrenProps }]>",
description: "The child content of the adder, containing some button-like element. In order to use the `FlexiAdd` component, your children must be button-like and spread the `props` passed."
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
