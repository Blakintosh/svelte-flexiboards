---
title: Widget Rendering
description: Learn about approaches to rendering widgets in Flexiboards.
category: Guides
published: true
---

<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import FlowExample from '$lib/components/docs/flow-grids/flow-example.svelte';
	import Flow2DExample from '$lib/components/docs/flow-grids/flow-2d-example.svelte';
</script>

## Introduction

## Snippet-based
Using [snippets](https://svelte.dev/docs/svelte/snippet) (specifically, `children`) is the most intuitive approach to rendering a widget. Simply put, you can put any elements or components as the content markup of your widget, like any other container component.

Flexiboards pass parameters into the `children` snippet which you can access if you desire, but you do not have to. This looks as follows:

```svelte
<!-- Without using the parameters (i.e. implicit children snippet) -->
<FlexiWidget>
    I'm a FlexiWidget!
</FlexiWidget>

<!-- With the parameters (e.g. get widget reactive data) - we discuss component and componentProps later -->
<FlexiWidget>
    {#snippet children({ widget, component, componentProps })}
        I'm a FlexiWidget at ({widget.x}, {widget.y})!
    {/snippet}
</FlexiWidget>
```

With the first example, we do not need any data from the `widget` controller, so there's no point in being explicit. Whereas, in the second example we're getting the reactive `x` and `y` properties on the controller and showing these (for illustration - see [FlexiWidget](/docs/components/widget) API for other properties like these).

As you can see, this approach is simple, and can work well. However, certain use cases lend themselves better to the approach we discuss next, which is using the `component` prop.

## Component-based
Alternatively, you can use the `component` prop to specify any Svelte component of your choosing to render inside of the FlexiWidget. 

Fundamentally, this is not dissimilar to the snippets approach; the main difference is that instead of needing some Svelte snippet in scope (or passed via a prop, for example), you just import the Svelte component.

## Combined Approach