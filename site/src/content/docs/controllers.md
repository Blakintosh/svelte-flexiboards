---
title: Controllers
description: Learn how to manipulate Flexiboard components via their controllers.
category: Introduction
published: true
---

## Introduction

At the heart of the `FlexiBoard`, `FlexiTarget`, and `FlexiWidget` components are their controllers. These controllers contain the logic for the components and manage the state of the board.

By default, the controllers are hidden -- they are created inside of the components. However, to set up your own actions, Flexiboards provides two primary ways to access these controllers.

## Method 1: `bind:controller` prop

This method is the simplest way to access the controllers, and is intuitive if you've already familiarised yourself with `bind:this` from Svelte (see [Svelte's documentation](https://svelte.dev/tutorial/svelte/bind-this) for more information). When its limitations do not affect you, this is the recommended method of accessing a controller.

Here's an example of using it to access the controller of a `FlexiBoard`:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from 'svelte-flexiboards';

	let { layout } = $props();

	let boardController: FlexiBoardController = $state() as FlexiBoardController;

	$effect(() => {
		// Do something with the controller... like import a layout in a later version!
		//boardController.importLayout(layout);
	});
</script>

<FlexiBoard bind:controller={boardController}>
	<!-- ... -->
</FlexiBoard>
```

This approach has one drawback, though. In order to safely run methods on `boardController`, you have to wait until the component has mounted. This means that you would be unable to access the controller on the server.

Flexiboard provides a second approach to accessing the controller without this limitation, which we'll cover next. However, if your use-case does not require immediate access to the controller during server-side rendering (SSR), the `bind:controller` prop is the recommended method.

## Method 2: `oninitialload` event

The `oninitialload` event allows you to specify a callback function that is called when the controller is initialised. This allows you to access and run actions on the controller during SSR.

Returning to our example of loading a layout, here's how you would do it using the `oninitialload` event:

```svelte
<script lang="ts">
	import { FlexiBoard, type FlexiBoardController } from 'svelte-flexiboards';

	let { layout } = $props();

	function doSomething(controller: FlexiBoardController) {
		// do something with the board!
	}
</script>

<FlexiBoard oninitialload={doSomething}>
	<!-- ... -->
</FlexiBoard>
```

This means that once the board mounts to the DOM, the `layout` being imported will be shown on the board without any client-side code needing to be run.

Note that when the `oninitialload` event fires, any variable binding to `controller` will also have been populated with the controller instance. If you prefer, this means you do not need to directly use the `controller` parameter passed to the callback function.

## Controller APIs

Now that you know how to access each controller, you should learn what you can do with them.

See the [FlexiBoard](/docs/components/board), [FlexiTarget](/docs/components/target), and [FlexiWidget](/docs/components/widget) APIs for more information.
