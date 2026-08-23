---
title: ResponsiveFlexiBoard
description: A wrapper component that manages different board layouts for different viewport breakpoints.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
    import api from '$lib/generated/api/responsive-flexi-board.json';
</script>

<!--
  The tables below are generated from the package sources by
  `site/scripts/extract-api.mjs` — edit the JSDoc in the source, not this page.
-->

## ResponsiveFlexiBoard (component)

<ApiReference title="Props" api={api.props} />

## ResponsiveFlexiBoardController

`ResponsiveFlexiBoard` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

<ApiReference title="Properties" api={api.controller.properties} />

<ApiReference title="Methods" api={api.controller.methods} />

## ResponsiveFlexiBoardConfiguration

The configuration object for the `ResponsiveFlexiBoard` component.

<ApiReference title="Properties" api={api.types.ResponsiveFlexiBoardConfiguration} />

## ResponsiveFlexiLayout

A responsive layout is a map of breakpoint keys to `FlexiLayout` objects:

```typescript
type ResponsiveFlexiLayout = {
    [breakpoint: string]: FlexiLayout;
};

// Example
{
    lg: {
        "main": [
            { type: "chart", x: 0, y: 0, width: 2, height: 2 }
        ]
    },
    default: {
        "main": [
            { type: "chart", x: 0, y: 0, width: 1, height: 2 }
        ]
    }
}
```

**Note:** Layouts are lazily initialized. Only breakpoints that have been actively visited will have stored layouts.
