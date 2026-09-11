---
title: Server-Side Rendering
description: How Flexiboards renders boards on the server, and how to handle responsive boards and stored layouts.
category: Guides
published: true
---

<script>
	import FrameworkText from '$lib/components/docs/framework-text.svelte';
	import Callout from '$lib/components/docs/callout.svelte';
	import Only from '$lib/components/docs/only.svelte';
</script>

<Only react>

<Callout variant="note" title="Server rendering and hydration">
	Declared widgets and <code>initialLayout</code> render with <code>renderToString</code> and hydrate with <code>hydrateRoot</code>. This site's interactive examples mount client-side, but the package does not require client-only rendering.
</Callout>

</Only>

## Introduction

Flexiboards supports server-side rendering with <FrameworkText svelte="SvelteKit" react="React" />. Declared layouts, or layouts supplied as server data, appear before hydration.

<Only react>

In React, the first hydration render retains the server's layout and assumed breakpoint. After commit, the adapter reads client storage and the actual viewport, then updates the board. `onfirstcreate` runs on the client, so use `initialLayout` or `initialLayouts` for data that must appear in the server HTML.

In Next.js App Router, compose the board inside a `'use client'` component. Client Components can still be server-rendered; the directive enables the hooks and interaction handlers. Pass serializable layout data from your Server Component and define registry render functions in the client component.

</Only>

This works because placement is pure logic. Widget positions are computed from your declared configuration, not measured from the DOM, and idle widgets are styled with CSS grid line placement (`grid-column` / `grid-row`) rather than pixel values. The pixel-measuring parts of the library, such as dragging, resizing and pointer tracking, only activate on interaction, which doesn't happen on a server.

This covers most cases, but two scenarios make server-side board rendering tricky, because hydration will differ:

- **Stored layouts.** A `loadLayout` / `loadLayouts` callback that relies on the client (such as client storage) can't run on the server.
- **Responsive boards.** The server can't know the viewport, so the rendered breakpoint has to be guessed.

The rest of this guide covers how to handle these two scenarios.

## Server-stored layouts

A layout the _server_ already has, such as a user's saved board fetched from your database, doesn't need any of the suspense machinery below. Pass it as `initialLayout`: a plain layout value (not a callback), applied during the initial render pass on both the server and the client.

<Only svelte>

Fetch the layout in a server `load` function and pass it through page data:

```ts
// +page.server.ts
export async function load({ locals }) {
	return { layout: await getBoardLayout(locals.user) };
}
```

```svelte
<script lang="ts">
	let { data } = $props();
</script>

<FlexiBoard
	config={{
		registry: { chart: { component: ChartWidget }, table: { component: TableWidget } },
		initialLayout: data.layout
	}}
>
	<!-- targets; any declared widgets act as a fallback for targets
	     the layout has no entry for -->
</FlexiBoard>
```

</Only>

<Only react>

Pass the server-fetched layout as a prop to your board component. Use the same value during hydration:

```tsx
function SavedBoard({ layout }) {
	return (
		<FlexiBoard config={{ registry: widgetRegistry, initialLayout: layout }}>
			<FlexiTarget keyName="main" />
		</FlexiBoard>
	);
}
```

</Only>

The board server-renders at the layout's final positions with no pending window. Give the client the same data so hydration matches. Like `importLayout`, entries resolve through the [registry](/docs/guides/exporting-importing-boards) via their `type`; targets without an entry in the layout fall back to their declared widgets. On responsive boards the equivalent is `initialLayouts`, keyed by breakpoint.

If a client-side `loadLayout` is also configured (say, local drafts beating the server copy), it still runs at hydration and overrides the initial layout. The board is marked pending until it does, as described next.

## Stored layouts and suspense

A board configured with `loadLayout` (or a responsive board with `loadLayouts`) usually reads from `localStorage` or a per-user store, which does not live on the server. Flexiboards therefore **skips the callback during SSR** and renders the layout declared in your markup as a stand-in (which can be empty). On the client, the callback runs during hydration and the stored layout replaces the stand-in.

<Callout variant="info" title="Your callback never runs on the server">
	Because of the way <code>loadLayout</code> works, you do not need to use a <code>browser</code> guard around it. Guards are still sensible if the callback is called from elsewhere in your own code.
</Callout>

Until that import resolves, the board's rendered layout may be wrong, since a returning user's saved arrangement can differ arbitrarily from the declared one. Give `FlexiBoard` a `suspense` <FrameworkText svelte="snippet" react="render function" /> to show a fallback:

<Only svelte>

```svelte
<FlexiBoard config={boardConfig}>
	{#snippet suspense({ reason })}
		<DashboardSkeleton />
	{/snippet}

	<FlexiTarget key="main">…</FlexiTarget>
</FlexiBoard>
```

</Only>

<Only react>

```tsx
<FlexiBoard config={boardConfig} suspense={(reason) => <DashboardSkeleton />}>
	<FlexiTarget keyName="main">…</FlexiTarget>
</FlexiBoard>
```

</Only>

The fallback is server-rendered alongside the board and shown in its place from the very first paint, before any JavaScript runs. It unmounts the moment the layout is confirmed on the client. `reason` tells you why it's showing: `'layout'` here, or `'breakpoint'` for the responsive case [below](#responsive-boards). Since it's ordinary markup, style it however you like, including with responsive utility classes.

### Styling it yourself with CSS

If you'd rather keep the real board visible and veil it (skeleton tints over the stand-in's geometry, say), omit the suspense fallback. A pending board always marks its root element, which you can target with plain CSS:

```html
<div role="application" data-flexi-pending="layout" aria-busy="true">…</div>
```

The attribute is present in the server HTML and during hydration, and is removed the moment the initial load resolves. That happens even when nothing was stored, since at that point the declared layout is confirmed final. Because it's plain markup, you can build a **CSS-only skeleton** that applies from the first paint, with no JavaScript involved:

```css
/* Disable interaction and veil widget contents behind skeleton tints. */
[data-flexi-pending] {
	pointer-events: none;
}
[data-flexi-pending] [role='cell'] {
	position: relative;
}
[data-flexi-pending] [role='cell'] > * {
	visibility: hidden;
}
[data-flexi-pending] [role='cell']::after {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: 10px;
	background: color-mix(in oklab, currentColor 7%, transparent);
}
```

The veil keeps the stand-in's geometry as gray blocks, a real skeleton, and the swap to the stored layout happens underneath it.

### Boards that declare no widgets

If everything on a board arrives through `loadLayout` (no `FlexiWidget` declarations at all), the server renders empty grids and the cell veil has nothing to cover. Pseudo-elements participate in grid layout as items, so you can paint ghost placeholder rows into empty pending grids:

```css
[data-flexi-pending] [role='grid']:not(:has([role='cell']))::before,
[data-flexi-pending] [role='grid']:not(:has([role='cell']))::after {
	content: '';
	grid-column: 1 / -1;
	min-height: 2.75rem;
	border-radius: 10px;
	background: color-mix(in oklab, currentColor 7%, transparent);
}
```

### Reading pending state from code

The flag is also exposed on the controller as `board.layoutPending` if you'd rather drive a custom loading treatment from your own markup.

## Responsive boards

A `ResponsiveFlexiBoard` picks its breakpoint with `matchMedia`, which we can't know ahead of time on the server. Flexiboards therefore chooses one breakpoint to render as a best guess. By default, this is the `default` breakpoint, which is usually your smallest layout, and desktop visitors, for example, would see a narrow board flash before hydration corrects it.

### Declaring an SSR breakpoint

The first strategy for this is to tell the server which breakpoint to assume, with `ssrBreakpoint`:

<Only svelte>

```svelte
<ResponsiveFlexiBoard
	config={{
		breakpoints: { lg: 1024, sm: 640 },
		ssrBreakpoint: 'lg'
	}}
>
	<!-- … -->
</ResponsiveFlexiBoard>
```

</Only>

<Only react>

```tsx
<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024, sm: 640 }, ssrBreakpoint: 'lg' }}>
	{/* boards */}
</ResponsiveFlexiBoard>
```

</Only>

Set this to the breakpoint most of your visitors land on. That reduces how often the rendered breakpoint mismatches theirs.

### Handling mismatches

The second strategy decides what a visitor sees when the breakpoint mismatches, before hydration has a chance to apply. The same `suspense` <FrameworkText svelte="snippet" react="render function" /> covers this. Pass it to the `FlexiBoard` inside your responsive board:

<Only svelte>

```svelte
<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024, sm: 640 }, ssrBreakpoint: 'lg' }}>
	{#snippet children({ currentBreakpoint })}
		<FlexiBoard config={boardConfig}>
			{#snippet suspense({ reason })}
				<BoardSkeleton />
			{/snippet}
			<!-- targets -->
		</FlexiBoard>
	{/snippet}
</ResponsiveFlexiBoard>
```

</Only>

<Only react>

```tsx
<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024, sm: 640 }, ssrBreakpoint: 'lg' }}>
	{({ currentBreakpoint }) => (
		<FlexiBoard config={boardConfig} suspense={(reason) => <BoardSkeleton />}>
			{/* targets */}
		</FlexiBoard>
	)}
</ResponsiveFlexiBoard>
```

</Only>

Flexiboards derives the assumed breakpoint's viewport range from your `breakpoints` config and generates the media query itself, so all three outcomes are handled with nothing hardcoded:

- **The guess matches the viewport.** The server board is correct: it shows untouched from first paint, fallback hidden.
- **The guess doesn't match.** The fallback shows instead of the wrong-shaped board until hydration swaps in the right one. Since the fallback is your markup, responsive utility classes inside it shape it for the actual viewport.
- **After hydration.** The fallback unmounts and the real board is confirmed.

`reason` is `'breakpoint'` here, with `assumed` carrying the guessed key. It is `'layout'` when an unresolved `loadLayouts` means the content itself is unknown, in which case the fallback shows at every viewport.

### Styling mismatches yourself with CSS

The pending attribute carries the guess too: `data-flexi-pending="lg"` until the client confirms, with `"layout"` winning when both apply. Your breakpoint thresholds are known constants, so CSS can handle the same three outcomes by hand. With `ssrBreakpoint: 'lg'` at a 1024px threshold, that's:

```css
/* Viewport matches the guess: lift the veil entirely. */
@media (width >= 1024px) {
	[data-flexi-pending='lg'] {
		pointer-events: auto;
	}
	[data-flexi-pending='lg'] [role='cell'] > * {
		visibility: visible;
	}
	[data-flexi-pending='lg'] [role='cell']::after,
	[data-flexi-pending='lg'] [role='grid']::before,
	[data-flexi-pending='lg'] [role='grid']::after {
		content: none;
	}
}

/* Viewport doesn't match: hide the wrong-shaped cells, show stacked bars. */
@media (width < 1024px) {
	[data-flexi-pending='lg'] [role='cell'] {
		display: none;
	}
	[data-flexi-pending='lg'] [role='grid']::before,
	[data-flexi-pending='lg'] [role='grid']::after {
		content: '';
		grid-column: 1 / -1;
		min-height: 2.75rem;
		border-radius: 10px;
		background: color-mix(in oklab, currentColor 7%, transparent);
	}
}
```

The media query ranges are hardcoded to your own breakpoint thresholds. That is a small duplication, but it keeps the whole treatment in CSS, with zero layout shift for correctly-guessed visitors.

<Callout variant="tip" title="Guessing per request">
	You can do better than a static guess by choosing <code>ssrBreakpoint</code> per request in a server <code>load</code> function: Chromium browsers send a <code>Sec-CH-UA-Mobile</code> header on every request (<code>?1</code> mobile, <code>?0</code> desktop), and a User-Agent check covers the rest. That shrinks the mismatch case to a small minority of visits; the CSS above still handles them.
</Callout>

The guess is also exposed on the controller as `board.breakpointPending` (`string | null`).

<Callout variant="note" title="Client-side rendering">
	A client-only route has no server HTML to hydrate. Both adapters support this mode too. Client storage and responsive breakpoints resolve when the board mounts; use the same suspense fallback if you want to hide its provisional content.
</Callout>

## Summary

| Situation                                        | Server renders                              | Marked with                         | Resolves                       |
| ------------------------------------------------ | ------------------------------------------- | ----------------------------------- | ------------------------------ |
| Declared layout, no stored state                 | The final board                             | Nothing                             | Already final                  |
| `initialLayout` / `initialLayouts` (server data) | The final board                             | Nothing                             | Already final                  |
| `loadLayout` / `loadLayouts` configured          | Declared or initial stand-in                | `data-flexi-pending="layout"`       | Client import at hydration     |
| Responsive board                                 | The `ssrBreakpoint` (else `default`) layout | `data-flexi-pending="<breakpoint>"` | Real `matchMedia` at hydration |

Everything else about SSR is automatic: no configuration, no wrappers, and no hydration warnings for boards whose layout is fully declared.
