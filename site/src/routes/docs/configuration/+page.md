<script lang="ts">
	import FlexiBoardAnatomy from '$lib/components/docs/overview/flexiboard-anatomy.svelte';
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

# Configuration

Flexiboards allows you to customise your board's targets and widgets, as well as the board itself.

These are managed by the `config` prop on the `FlexiBoard` and `FlexiTarget` components.
For `FlexiWidget`, the props passed to it are the configuration options.

Flexiboards uses a cascading configuration system which includes reactivity over many properties, which we discuss in this section.

## Cascading Configuration

On each configuration object of components that support children, the `config` prop provides a defaults property, allowing you to specify a default configuration for the children.

For example, if you want to specify a default layout for all of your targets, you can do so like this:

```svelte
<FlexiBoard config={{
    targetDefaults: {
        layout: {
            type: 'flow',
            flowAxis: 'row',
            placementStrategy: 'append'
        }
    }
}}>
```

Now, if you don't specify a layout for a target, it will use the default layout specified in the `targetDefaults` property.

This system works in a **cascading** manner, where (following the hierarchy of FlexiBoard -> FlexiTarget -> FlexiWidget) the configuration applied is the nearest specified configuration.

For example, let's suppose that we have `widgetDefaults.className = 'a'` on our board's configuration, and `widgetDefaults.className = 'b'` on our target's configuration.

- If we specify a class prop, `c`, on a widget, then the widget will have class `c` only.
- If we don't specify a class on the widget, then the widget will have class `b`.
- If we don't specify a class on the widget, and we didn't specify `widgetDefaults.className = 'b'` on our widget's parent target, then the widget will have class `a`.

This system prioritises the widget's configuration first, but chooses defaults where properties are not specified.

## Reactivity

At its core, Flexiboards' configuration system is designed to be reactive. This means that if you pass a reactive configuration object (one that is defined with a Svelte rune) to the `config` prop, then the board will respond to changes made to a number of properties on that object.

For example, you can use this system to quickly change whether widgets are draggable on the board.

```svelte
<script lang="ts">
	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true
		}
	});
</script>

<FlexiBoard config={boardConfig}>
	<!-- Your targets and widgets would be inside here. -->
</FlexiBoard>
```

Here, we've set `widgetDefaults.draggable = true` on our board's configuration, so all widgets (that haven't specified their own `draggable` prop) will be draggable. Disabling this is as simple as setting `boardConfig.widgetDefaults.draggable = false` and the board (and its widgets) will update automatically.

Not all properties are reactive like this. Generally, these are the properties that would be unnatural to change on the fly.

We document each component's configuration on their respective API pages. This includes which configuration properties are reactive and which are not.
