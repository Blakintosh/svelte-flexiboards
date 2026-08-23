---
title: FlexiWidget
description: A widget is a component (such as a tile) that is stored within a target (dropzone). Widgets can be moved around within a target or between targets.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import api from '$lib/generated/api/flexi-widget.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs` — edit the JSDoc in the source, not this page.
-->

## FlexiWidget (component)

<ApiReference title="Props" api={api.props} />

## FlexiWidgetController

`FlexiWidgetController` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiWidgetController` allows you to access widget state directly.

<ApiReference title="Properties" api={api.controller.properties} />

{#if api.controller.methods.length}

<ApiReference title="Methods" api={api.controller.methods} />

{:else}

`FlexiWidgetController` does not expose any methods.

{/if}

## FlexiWidgetConfiguration

The configuration object for the `FlexiWidget` component. This is not reactive when invoked as props on the component, so to mutate it reactively you will need to mutate properties on the controller.

<ApiReference title="Properties" api={api.types.FlexiWidgetConfiguration} />
