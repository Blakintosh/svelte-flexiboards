---
title: FlexiDelete
description: A component that allows you to delete widgets from a board when they are dropped over its child element.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
</script>

## FlexiDelete (component)

<ApiReference title="Props" api={[
{
name: "children",
type: "Snippet<[{ props: FlexiDeleteChildrenProps }]>",
description: "The child content of the deleter, which should have some element below it. In order to use the `FlexiDelete` component, your children must be hoverable and spread the `props` passed."
}
]} />

`FlexiDelete` does not use a controller.
