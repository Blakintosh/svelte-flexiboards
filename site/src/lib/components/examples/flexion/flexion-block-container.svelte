<script module lang="ts">
	import type { Component } from 'svelte';
	import { FlexiWidget, simpleTransitionConfig, type FlexiWidgetController } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import Grabber from '../common/grabber.svelte';

	type FlexionBlockContainerProps = {
		component?: Component<any>;
		// Content for the block component; blocks are otherwise identical shells.
		props?: Record<string, unknown>;
	};
</script>

<script lang="ts">
	let { component: Component, props = {} }: FlexionBlockContainerProps = $props();
</script>

<FlexiWidget
	class={(widget: FlexiWidgetController) =>
		cn(
			'group flex w-full min-w-0 items-start gap-4 rounded-[10px] px-2 py-1 transition-colors duration-[120ms] motion-reduce:transition-none hover:bg-rule-faint',
			widget.isGrabbed && ' bg-panel opacity-60 shadow-lift',
			widget.isShadow && 'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent'
		)}
	transition={simpleTransitionConfig()}
>
	{#snippet children()}
		<Grabber size={16} class="shrink-0 py-1 group-hover:opacity-100 lg:opacity-0" />

		<div class="w-full min-w-0 grow">
			<Component {...props} />
		</div>

		<!-- The affordance teaches itself on hover; no tooltip, no persistent chrome. -->
		<span
			class="ml-auto hidden shrink-0 self-start pt-1.5 text-[11px] font-semibold text-fx-accent opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 motion-reduce:transition-none lg:block"
		>
			Grab to reorder
		</span>
	{/snippet}
</FlexiWidget>
