<script module lang="ts">
	import type { Component, Snippet } from 'svelte';
	import type { FlexiWidgetProps } from 'svelte-flexiboards';

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

	let { title, component, children: childrenSnippet, ...props }: DashboardTileProps = $props();
</script>

<FlexiWidget {component} {...props}>
	{#snippet children({ widget, Component })}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-xl font-semibold">
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
		</Card.Root>
	{/snippet}
</FlexiWidget>
