<script module lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { FlexiWidgetController, FlexiWidgetProps } from 'svelte-flexiboards';

	type DashboardTileProps = FlexiWidgetProps & {
		title: string;
		component?: Component;
		children?: Snippet<[{ widget: FlexiWidgetProps; Component?: Component }]>;
	};
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { FlexiGrab, FlexiWidget } from 'svelte-flexiboards';
	import Grabber from '../common/grabber.svelte';
	import Resizer from '../common/resizer.svelte';
	import { MediaQuery } from 'svelte/reactivity';

	let {
		title,
		component: Component,
		children: childrenSnippet,
		...props
	}: DashboardTileProps = $props();

	let mediaQuery = $state(new MediaQuery('(min-width: 1024px)'));
	let grabberSize = $derived(mediaQuery.current ? 20 : 16);
</script>

<FlexiWidget
	{...props}
	class={(widget: FlexiWidgetController) => [
		widget.isGrabbed && 'animate-pulse opacity-50',
		widget.isShadow && 'opacity-50'
	]}
>
	{#snippet children({ widget })}
		<Card.Root class="flex h-full w-full flex-col justify-between">
			<div>
				<Card.Header class="p-4 lg:p-6">
					<Card.Title class="flex items-center gap-2 text-sm font-semibold lg:text-xl">
						{#if widget.draggable}
							<Grabber size={grabberSize} class="text-muted-foreground" />
						{/if}
						{title}
					</Card.Title>
				</Card.Header>
				<Card.Content class="p-4 lg:p-6">
					{#if childrenSnippet}
						{@render childrenSnippet?.({ widget, Component })}
					{:else if Component}
						<Component />
					{/if}
				</Card.Content>
			</div>
			<Card.Footer class="flex justify-end">
				{#if widget.resizable}
					<Resizer size={grabberSize} class="cursor-col-resize text-muted-foreground" />
				{/if}
			</Card.Footer>
		</Card.Root>
	{/snippet}
</FlexiWidget>
