---
title: FlexiBoard
description: The main container component of a board, managing the targets and widgets within it.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import api from '$lib/generated/api/flexi-board.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs` — edit the JSDoc in the source, not this page.
-->

## FlexiBoard (component)

<ApiReference title="Props" api={api.props} />

## FlexiBoardController

`FlexiBoard` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

The `FlexiBoardController` allows you to manage the board directly and carry out actions.

<ApiReference title="Properties" api={api.controller.properties} />

<ApiReference title="Methods" api={api.controller.methods} />

## FlexiBoardConfiguration

The configuration object for the `FlexiBoard` component, which supports reactivity where specified.

To use reactivity, ensure that the `config` prop has a reactive source (proxy).

<ApiReference title="Properties" api={api.types.FlexiBoardConfiguration} />

### FlexiTargetDefaults

The default configuration for targets.

<ApiReference title="Properties" api={api.types.FlexiTargetDefaults} />

### FlexiWidgetDefaults

The default configuration for widgets.

<ApiReference title="Properties" api={api.types.FlexiWidgetDefaults} />
