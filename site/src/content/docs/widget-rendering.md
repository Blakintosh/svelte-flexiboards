---
title: Widget Rendering
description: Learn about approaches to rendering widgets in Flexiboards.
category: Guides
published: true
---

<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
</script>

A `FlexiWidget` is an invisible wrapper: it positions itself in the grid and handles drag and drop, and you render whatever goes inside. This guide covers the two ways to do that, and how to style a widget by its state:

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
			class="flex items-center justify-center rounded-lg bg-muted text-foreground"
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
				<FlexiWidget x={0} y={0}>{({ widget }) => (widget.isGrabbed ? 'Grabbed' : 'Drag me')}</FlexiWidget>
				<FlexiWidget
					x={1}
					y={1}
					draggability="none"
					className="flex items-center justify-center rounded-lg bg-muted text-foreground"
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

<Only svelte>

Using [snippets](https://svelte.dev/docs/svelte/snippet) (specifically, `children`) is the most intuitive approach to rendering a widget. Any elements or components you write become the content markup of your widget, like any other container component.

Flexiboards pass parameters into the `children` snippet which you can access if you desire, but you do not have to. This looks as follows:

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

Passing `children` is the most intuitive approach to rendering a widget. Any elements or components you write become the content of your widget, like any other container component.

`children` may also be a *render function*, which Flexiboards calls with the widget's controller. This is the React counterpart of Svelte's `children` snippet parameters, and lets you read the widget's reactive state without a separate component:

```tsx
{/* Without the parameters — plain JSX children */}
<FlexiWidget>I'm a FlexiWidget!</FlexiWidget>

{/* With the parameters (e.g. get widget reactive data) — we discuss component and componentProps later */}
<FlexiWidget>
	{({ widget }) => (
		<>
			I'm a FlexiWidget at ({widget.x}, {widget.y})!
		</>
	)}
</FlexiWidget>
```

</Only>

With the first example, we do not need any data from the `widget` controller, so there's no point in being explicit. Whereas, in the second example we're getting the reactive `x` and `y` properties on the controller and showing these (for illustration - see [FlexiWidget](/docs/components/widget) API for other properties like these).

This approach is short and works well. Some cases suit the `component` prop better, which we discuss next.

## Component-based

<Only svelte>

Alternatively, you can use the `component` prop to specify any Svelte component of your choosing to render inside of the FlexiWidget.

Fundamentally, this is not dissimilar to the snippets approach; the main difference is that instead of needing some Svelte snippet in scope (or passed via a prop, for example), you just import the Svelte component. This might look as follows:

```svelte
<script>
	import MyComponent from './my-component.svelte';
</script>

<FlexiWidget component={MyComponent} />
```

You can also pass props through to it with `componentProps`, and combine `component` with `children` if you want a consistent wrapper around a per-widget component.

In this scenario you cannot reach the `widget` controller as easily as with the snippet approach, and it is not passed as a prop on the component. Instead, use the `getFlexiwidgetCtx` helper function to get the context of the widget:

```svelte
<!-- my-component.svelte -->
<script>
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';

	const widget = getFlexiwidgetCtx();
</script>
```

This uses the [Svelte Context API](https://svelte.dev/docs/svelte/context) under the hood, so call it from the top level of the component, or from a function that the top level calls.

Additionally, any Svelte component rendered inside of the FlexiWidget, whether via a snippet or a descendant component, will have access to the `widget` controller through the same mechanism.

</Only>

<Only react>

Alternatively, you can use the `component` prop to specify any React component of your choosing to render inside of the FlexiWidget.

Fundamentally, this is not dissimilar to the children approach; the main difference is that instead of writing the content inline, you just import the component. This might look as follows:

```tsx
import { FlexiWidget } from '@flexiboards/react';
import MyComponent from './my-component';

<FlexiWidget component={MyComponent} />;
```

You can also pass props through to it with `componentProps`, and combine `component` with `children` if you want a consistent wrapper around a per-widget component:

```tsx
<FlexiWidget component={NumberTile} componentProps={{ number: 7 }} />
```

This is especially useful when widgets are created dynamically, from an imported layout or by a `FlexiAdd`, since the component and its props are just values in the widget's configuration.

In this scenario the widget controller is not passed as a prop on the component. Instead, use the `useFlexiWidget()` hook:

```tsx
// my-component.tsx
import { useFlexiWidget } from '@flexiboards/react';

export default function MyComponent() {
	const widget = useFlexiWidget();

	return <div className={widget.isGrabbed ? 'opacity-50' : undefined}>...</div>;
}
```

The controller returned is a reactive proxy. Read any of its signal-backed getters during render, such as `isGrabbed`, `isShadow`, `dropRejected`, `draggability`, `x` or `y`, and your component re-renders when they change. No subscription or extra hook is needed.

Additionally, any React component rendered inside of the FlexiWidget, whether via `children` or as a descendant of the widget's component, has access to the `widget` controller through the same hook.

</Only>

## Styling by state

Whichever approach you use, the widget's own element is styled with its class prop (`class` in Svelte, `className` in React), or with `widgetDefaults.className` further up the cascade. It accepts either a class value or a function that receives the widget's controller. The function is the neatest way to make a widget's provisional states visible:

- `isGrabbed` while the widget is being dragged, and `isResizing` while it is being resized.
- `isShadow` on the preview left in the grid while the widget is held.
- `dropRejected` while the widget is over a target that cannot place it. The shadow is withdrawn, the cursor becomes `not-allowed`, and releasing sends the widget back. The same flag is available on the target as `target.dropRejected`.

<Only svelte>

```svelte
<FlexiWidget
	class={(widget) => [
		'rounded-lg bg-muted px-4 py-2',
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
			'rounded-lg bg-muted px-4 py-2',
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
