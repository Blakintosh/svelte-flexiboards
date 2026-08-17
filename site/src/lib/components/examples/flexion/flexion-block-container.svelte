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
			'group flex w-full min-w-0 items-start gap-4 px-2 py-1 transition-colors duration-[120ms] hover:bg-tint',
			widget.isGrabbed && 'border border-vermillion opacity-60',
			widget.isShadow && 'border border-dashed border-vermillion bg-tint-accent opacity-70'
		)}
	transition={simpleTransitionConfig()}
>
	{#snippet children()}
		<Grabber
			size={16}
			class="shrink-0 py-1 group-hover:opacity-100 lg:opacity-0"
		/>

		<div class="w-full min-w-0 grow">
			<Component />
		</div>
	{/snippet}
</FlexiWidget>
