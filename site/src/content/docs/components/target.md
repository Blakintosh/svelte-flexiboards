---
title: FlexiTarget
description: A 'target' for widgets, or a dropzone. Stores a series of widget instances in a managed grid layout.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import api from '$lib/generated/api/flexi-target.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs` — edit the JSDoc in the source, not this page.
-->

## FlexiTarget (component)

<ApiReference title="Props" api={api.props} />

## FlexiTargetController

`FlexiTargetController` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiTargetController` allows you to manage the target directly and carry out actions.

<ApiReference title="Properties" api={api.controller.properties} />

<ApiReference title="Methods" api={api.controller.methods} />

More methods will be added in a future version.

## FlexiTargetConfiguration

The configuration object for the `FlexiTarget` component (the `config` prop accepts the partial form shown below), which supports reactivity where specified.

To use reactivity, ensure that the `config` prop has a reactive source (proxy).

<ApiReference title="Properties" api={api.types.FlexiTargetPartialConfiguration} />

### FlexiWidgetDefaults

The default configuration for widgets.

<ApiReference title="Properties" api={api.types.FlexiWidgetDefaults} />
