---
title: FlexiDelete
description: A component that allows you to delete widgets from a board when they are dropped over it.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import HeadsUp from '$lib/components/docs/heads-up.svelte';
</script>

<HeadsUp title="Breaking Change Notice">
    In order to make FlexiDelete more accessible, we now create a wrapper div around the FlexiDelete component. Previously, the user was responsible for creating such an element.

    You can style the FlexiDelete div using the new `class` prop. 
    
    Please note that the `props` snippet property containing the `onpointerenter` and `onpointerleave` events is now deprecated and will be removed in v0.4. They are currently maintained as dead event handlers for compatibility purposes.

    See [Breaking Changes in v0.3](/docs/breaking-changes-to-03) for more details.
</HeadsUp>

## FlexiDelete (component)

<ApiReference title="Props" api={[
{
name: "class",
type: "FlexiDeleteClasses",
description: "The class names to apply to the deleter's container element."
},
{
name: "children",
type: "Snippet<[{ deleter: FlexiDeleteController }]>",
description: "The content rendered inside of the deleter."
}
]} />


## FlexiDeleteController

`FlexiDelete` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiDeleteController` allows you to access state information on the deleter.

<ApiReference title="Properties" api={[
{
name: "isHovered",
type: "boolean",
description: "Whether the deleter is currently being hovered by the pointer. You should prefer the use of this to CSS hover, because it is more accessible."
}
]} />
