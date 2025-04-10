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

	let { title, component, children: childrenSnippet, ...props }: DashboardTileProps = $props();
</script>

<FlexiWidget
	{component}
	{...props}
	class={(widget: FlexiWidgetController) => [
		widget.isGrabbed && 'animate-pulse opacity-50',
		widget.isShadow && 'opacity-50'
	]}
>
	{#snippet children({ widget, component: Component })}
		<Card.Root class="flex h-full w-full flex-col justify-between">
			<div>
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-lg lg:text-xl font-semibold">
						{#if widget.draggable}
							<Grabber size={20} class="text-muted-foreground" />
						{/if}
						{title}
					</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if childrenSnippet}
						{@render childrenSnippet?.({ widget, Component })}
					{:else if Component}
						<Component />
					{/if}
				</Card.Content>
			</div>
			<Card.Footer class="flex justify-end">
				{#if widget.resizable}
					<Resizer size={20} class="cursor-col-resize text-muted-foreground" />
				{/if}
			</Card.Footer>
		</Card.Root>
	{/snippet}
</FlexiWidget>
