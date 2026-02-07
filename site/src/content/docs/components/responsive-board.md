---
title: ResponsiveFlexiBoard
description: A wrapper component that manages different board layouts for different viewport breakpoints.
category: Components
published: true
---

<script lang="ts">
    import ApiReference from '$lib/components/docs/api-reference.svelte';
</script>

## ResponsiveFlexiBoard (component)

<ApiReference title="Props" api={[
{
name: "config",
type: "ResponsiveFlexiBoardConfiguration",
description: "The configuration object for the responsive board."
},
{
name: "lg",
type: "Snippet",
description: "Snippet rendered for large breakpoints. No parameters."
},
{
name: "md",
type: "Snippet",
description: "Snippet rendered for medium breakpoints. No parameters."
},
{
name: "sm",
type: "Snippet",
description: "Snippet rendered for small breakpoints. No parameters."
},
{
name: "xs",
type: "Snippet",
description: "Snippet rendered for extra-small breakpoints. No parameters."
},
{
name: "children",
type: "Snippet<[{ currentBreakpoint: string }]>",
description: "Fallback snippet rendered when no breakpoint-specific snippet matches. Receives the current breakpoint as a parameter."
},
{
name: "controller",
type: "ResponsiveFlexiBoardController (bindable)",
description: "The controller for the responsive board."
},
{
name: "onfirstcreate",
type: "(controller: ResponsiveFlexiBoardController) => void",
description: "A callback that fires when the board's controller is first created."
}
]} />

## ResponsiveFlexiBoardController

`ResponsiveFlexiBoard` uses a [controller](/docs/controllers) to manage its state and behaviour. You can access the controller via binding to the `controller` prop or using the `onfirstcreate` callback.

<ApiReference title="Properties" api={[
{
name: "currentBreakpoint",
type: "string",
description: "The currently active breakpoint key (e.g., 'lg', 'md', or 'default')."
},
{
name: "definedBreakpoints",
type: "string[]",
description: "All breakpoint keys that have stored layouts."
},
{
name: "configuredBreakpoints",
type: "string[]",
description: "All breakpoint keys from the configuration."
}
]} />

<ApiReference title="Methods" api={[
{
name: "importLayout",
type: "(layout: ResponsiveFlexiLayout) => void",
description: "Imports layouts for all breakpoints, replacing any existing stored layouts."
},
{
name: "exportLayout",
type: "() => ResponsiveFlexiLayout",
description: "Exports layouts for all breakpoints that have been used."
},
{
name: "getLayoutForBreakpoint",
type: "(breakpoint: string) => FlexiLayout | undefined",
description: "Gets the stored layout for a specific breakpoint."
},
{
name: "setLayoutForBreakpoint",
type: "(breakpoint: string, layout: FlexiLayout) => void",
description: "Sets the layout for a specific breakpoint."
},
{
name: "hasLayoutForBreakpoint",
type: "(breakpoint: string) => boolean",
description: "Checks if a layout exists for a specific breakpoint."
}
]} />

## ResponsiveFlexiBoardConfiguration

The configuration object for the `ResponsiveFlexiBoard` component.

<ApiReference title="Properties" api={[
{
name: "breakpoints",
type: "Record<string, number>",
description: "Breakpoint definitions mapping keys (lg, md, sm, xs) to minimum viewport widths in pixels. Evaluated largest-first; the first match wins."
},
{
name: "loadLayouts",
type: "() => ResponsiveFlexiLayout | undefined",
description: "Function to load initial layouts on mount. Called once when the responsive board is ready."
},
{
name: "onLayoutsChange",
type: "(layouts: ResponsiveFlexiLayout) => void",
description: "Callback fired when any layout changes (widget moved, resized, added, or removed). Receives all breakpoint layouts."
},
{
name: "onBreakpointChange",
type: "(newBreakpoint: string, oldBreakpoint: string) => void",
description: "Callback fired when the active breakpoint changes."
}
]} />

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
