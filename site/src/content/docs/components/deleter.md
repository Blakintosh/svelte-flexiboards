---
title: FlexiDelete
description: A component that allows you to delete widgets from a board when they are dropped over it.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import api from '$lib/generated/api/flexi-delete.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs` — edit the JSDoc in the source, not this page.
-->

## FlexiDelete (component)

<ApiReference title="Props" api={api.props} />

## FlexiDeleteController

`FlexiDelete` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiDeleteController` allows you to access state information on the deleter.

<ApiReference title="Properties" api={api.controller.properties} />
