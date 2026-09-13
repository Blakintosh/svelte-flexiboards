---
title: Widget rendering
description: Learn about approaches to rendering widgets in Flexiboards.
category: Guides
published: true
---

<script lang="ts">
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
	import Only from '$lib/components/docs/only.svelte';
</script>

`FlexiWidget` registers content in a target. Flexiboards handles placement and interaction; your content defines what the widget displays. This demo uses the [docs example styling](/docs/overview#example-styling):

<Only svelte>

```svelte example title="Styling by state"
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiBoard class="size-72 rounded-xl border p-8 lg:size-96">
	<FlexiTarget
		class="h-full w-full gap-4"
		containerClass="h-full w-full"
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: { type: 'free', minRows: 2, minColumns: 2, maxRows: 2, maxColumns: 2 },
			widgetDefaults: {
				className: (widget) => [
					'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
					widget.isShadow && 'opacity-50',
					widget.isGrabbed && 'animate-pulse',
					widget.dropRejected && 'bg-destructive'
				]
			}
		}}
	>
		<FlexiWidget x={0} y={0}>
			{#snippet children({ widget })}
				{widget.isGrabbed ? 'Grabbed' : 'Drag me'}
			{/snippet}
		</FlexiWidget>
		<FlexiWidget
			x={1}
			y={1}
			draggability="none"
			class="bg-muted text-foreground flex items-center justify-center rounded-lg"
		>
			Fixed
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx example title="Styling by state"
import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';

export function StylingByState() {
	return (
		<FlexiBoard className="size-72 rounded-xl border p-8 lg:size-96">
			<FlexiTarget
				className="h-full w-full gap-4"
				containerClassName="h-full w-full"
				config={{
					rowSizing: 'minmax(0, 1fr)',
					layout: { type: 'free', minRows: 2, minColumns: 2, maxRows: 2, maxColumns: 2 },
					widgetDefaults: {
						className: (widget: FlexiWidgetController) =>
							clsx(
								'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
								widget.isShadow && 'opacity-50',
								widget.isGrabbed && 'animate-pulse',
								widget.dropRejected && 'bg-destructive'
							)
					}
				}}
			>
				<FlexiWidget x={0} y={0}>
					{({ widget }) => (widget.isGrabbed ? 'Grabbed' : 'Drag me')}
				</FlexiWidget>
				<FlexiWidget
					x={1}
					y={1}
					draggability="none"
					className="bg-muted text-foreground flex items-center justify-center rounded-lg"
				>
					Fixed
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}
```

</Only>

Drag the first widget: its label changes while grabbed, its shadow in the grid is translucent, and it turns red over the fixed widget because that drop would be rejected.

## Children-based

These declaration excerpts belong inside an existing target. Keep the imports and board setup from the opening example.

<Only svelte>

Pass a `children` [snippet](https://svelte.dev/docs/svelte/snippet) to render content inline. Any elements or components you write become the content markup of your widget, like any other container component.

Flexiboards passes parameters into the `children` snippet, which you can read or ignore:

```svelte
<!-- Without using the parameters (i.e. implicit children snippet) -->
<FlexiWidget>I'm a FlexiWidget!</FlexiWidget>

<!-- With the parameters (e.g. get widget reactive data) - we discuss component and componentProps later -->
<FlexiWidget>
	{#snippet children({ widget })}
		I'm a FlexiWidget at ({widget.x}, {widget.y})!
	{/snippet}
</FlexiWidget>
```

</Only>

<Only react>

Pass `children` to render content inline. Any elements or components you write become the content of your widget, like any other container component.

`children` may also be a _render function_, which Flexiboards calls with the widget's controller. Use the render function to read the widget's reactive state without a separate component:

```tsx
{
	/* Without the parameters: plain JSX children */
}
<FlexiWidget>I'm a FlexiWidget!</FlexiWidget>;

{
	/* With the parameters, e.g. the widget's reactive state */
}
<FlexiWidget>
	{({ widget }) => (
		<>
			I'm a FlexiWidget at ({widget.x}, {widget.y})!
		</>
	)}
</FlexiWidget>;
```

</Only>

The first example needs no data from the `widget` controller, so it takes no parameters. The second reads the reactive `x` and `y` properties on the controller and shows them; the [FlexiWidget](/docs/components/widget) API lists the other properties you can read this way.

Use a component when several widgets share a renderer, or when a registry selects content for imported widgets.

## Component-based

<Only svelte>

Set `component` to an imported Svelte component. This declaration excerpt assumes `my-component.svelte` exists and belongs inside your existing target:

```svelte
<script>
	import { FlexiWidget } from '@flexiboards/svelte';
	import MyComponent from './my-component.svelte';
</script>

<FlexiWidget component={MyComponent} />
```

Pass props to the component with `componentProps`. A `children` snippet takes precedence over `component`. To wrap the configured component, render `widget.component` with `widget.componentProps` inside that snippet; Flexiboards does not render both automatically.

In this scenario the `widget` controller is not passed as a prop on the component. Instead, use the `getFlexiwidgetCtx` helper function to get the context of the widget:

```svelte
<!-- my-component.svelte -->
<script>
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';

	const widget = getFlexiwidgetCtx();
</script>

<span>Column {widget.x}, row {widget.y}</span>
```

This uses the [Svelte Context API](https://svelte.dev/docs/svelte/context) under the hood, so call it from the top level of the component, or from a function that the top level calls.

Any Svelte component rendered inside of the FlexiWidget, whether via a snippet or a descendant component, has access to the `widget` controller through the same mechanism.

</Only>

<Only react>

Set `component` to an imported React component. This declaration excerpt assumes `my-component.tsx` exists and belongs inside your existing target:

```tsx
import { FlexiWidget } from '@flexiboards/react';
import MyComponent from './my-component';

<FlexiWidget component={MyComponent} />;
```

Pass props to the component with `componentProps`. The following declaration excerpt assumes `NumberTile` is your imported component with a `number` prop:

```tsx
<FlexiWidget component={NumberTile} componentProps={{ number: 7 }} />
```

`children` takes precedence over `component`. To wrap the configured component, use a children render function, assign `widget.component` to a capitalized local variable, and render it with `widget.componentProps`. Flexiboards does not render both automatically.

Storing `component` and `componentProps` in a registry entry also supplies content for widgets created from an imported layout or by a `FlexiAdd` using that type.

In this scenario the widget controller is not passed as a prop on the component. Instead, use the `useFlexiWidget()` hook:

```tsx
// my-component.tsx
import { useFlexiWidget } from '@flexiboards/react';

export default function MyComponent() {
	const widget = useFlexiWidget();

	return <div className={widget.isGrabbed ? 'opacity-50' : undefined}>...</div>;
}
```

The controller returned is a reactive proxy. Read any of its signal-backed getters during render, such as `isGrabbed`, `isShadow`, `dropRejected`, `draggability`, `x` or `y`, and your component re-renders when they change. You need no subscription or extra hook.

Any React component rendered inside of the FlexiWidget, whether via `children` or as a descendant of the widget's component, has access to the `widget` controller through the same hook.

</Only>

## Styling by state

The class-prop excerpts below extend the opening example. Keep its imports and enclosing board and target.

Whichever approach you use, the widget's own element is styled with its class prop (<FrameworkText svelte="class" react="className" code />), or with `widgetDefaults.className` further up the cascade. It accepts either a class value or a function that receives the widget's controller. Use a class function to style a widget while it is grabbed, previewed, or rejected:

- `isGrabbed` while the widget is being dragged, and `isResizing` while it is being resized.
- `isShadow` on the preview left in the grid while the widget is held.
- `dropRejected` while the widget is over a target that cannot place it. The shadow is withdrawn, the cursor becomes `not-allowed`, and releasing sends the widget back. The same flag is available on the target as `target.dropRejected`.

<Only svelte>

```svelte
<FlexiWidget
	class={(widget) => [
		'bg-muted rounded-lg px-4 py-2',
		widget.isShadow && 'opacity-50',
		widget.isGrabbed && 'animate-pulse opacity-50',
		widget.dropRejected && 'opacity-30'
	]}
>
	I'm a FlexiWidget!
</FlexiWidget>
```

</Only>

<Only react>

In React, the class function must return a **string**, so compose conditional classes with a helper such as `clsx`:

```tsx
import { FlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';

<FlexiWidget
	className={(widget: FlexiWidgetController) =>
		clsx(
			'bg-muted rounded-lg px-4 py-2',
			widget.isShadow && 'opacity-50',
			widget.isGrabbed && 'animate-pulse opacity-50',
			widget.dropRejected && 'opacity-30'
		)
	}
>
	I'm a FlexiWidget!
</FlexiWidget>;
```

</Only>
