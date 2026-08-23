---
title: FlexiAdd
description: A component that allows you to drag in new widgets into a board.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import api from '$lib/generated/api/flexi-add.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs` — edit the JSDoc in the source, not this page.
-->

## FlexiAdd (component)

<ApiReference title="Props" api={api.props} />

## FlexiAddController

`FlexiAdd` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

<ApiReference title="Properties" api={api.controller.properties} />

## AdderWidgetConfiguration

`AdderWidgetConfiguration` allows you to specify the configuration of the widget that is created and grabbed, as well as the initial width and height that the grabbed widget will have.

<ApiReference title="Properties" api={api.types.AdderWidgetConfiguration} />
