<script module lang="ts">
	import type { Component } from 'svelte';
	import { FlexiWidget, simpleTransitionConfig, type FlexiWidgetController } from 'svelte-flexiboards';
	import { cn } from '$lib/utils.js';
	import Grabber from '../common/grabber.svelte';

	type FlexionBlockContainerProps = {
		component?: Component;
	};
</script>

<script lang="ts">
	let { component: Component }: FlexionBlockContainerProps = $props();
</script>

<FlexiWidget
	class={(widget: FlexiWidgetController) =>
		cn(
			'group flex w-full min-w-0 items-start gap-4 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50',
			widget.isGrabbed && 'animate-pulse opacity-50',
			widget.isShadow && 'opacity-40'
		)}
	transition={simpleTransitionConfig()}
>
	{#snippet children()}
		<Grabber
			size={16}
			class="shrink-0 py-1 text-muted-foreground duration-75 group-hover:opacity-100 lg:opacity-0"
		/>

		<div class="w-full min-w-0 grow">
			<Component />
		</div>
	{/snippet}
</FlexiWidget>
