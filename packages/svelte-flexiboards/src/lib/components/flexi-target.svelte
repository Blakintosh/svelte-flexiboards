<script module lang="ts">
	import type { Snippet } from 'svelte';
	import { flexitarget, type FlexiTarget as FlexiTargetSystem } from '$lib/system/target.svelte.js';
	import type { FlexiTargetConfiguration } from '$lib/system/types.js';

	export type FlexiTargetProps = {
		header?: Snippet<[{ target: FlexiTargetSystem }]>;
		children?: Snippet;
		footer?: Snippet;
		containerClass?: string;
		class?: string;
		name?: string;
		debug?: boolean;
		config?: FlexiTargetConfiguration;
	};
</script>

<script lang="ts">
	import FlexiWidget from './flexi-widget.svelte';
	import FlexiWidgetWrapper from './flexi-widget-wrapper.svelte';
	import FlexiDebug from './flexi-debug.svelte';
	import FlexiGrid from './flexi-grid.svelte';

	let {
		children,
		class: className,
		header,
		footer,
		debug,
		config,
		containerClass
	}: FlexiTargetProps = $props();

	const { onpointerenter, onpointerleave, target } = flexitarget(config);

	let rendered = $derived(false);
</script>

<div>
	<div
		class={containerClass}
		{onpointerenter}
		{onpointerleave}
		role="grid"
		tabindex={0}
	>
		{@render header?.({ target })}

		<!-- Allow user to specify components directly, then mount them to the actual target list dynamically -->
		<!-- TODO: We still need to handle the SSR case where we've received widgets up front. -->
		<FlexiGrid class={className}>
			{#if !target.rendered && children}
				{@render children()}
			{:else if target.rendered}
				{#each target.widgets as widget (widget)}
					<FlexiWidgetWrapper {widget}>
						<FlexiWidget />
					</FlexiWidgetWrapper>
				{/each}
			{/if}
		</FlexiGrid>
		{@render footer?.()}
	</div>

	{#if debug}
		<FlexiDebug {target} />
	{/if}
</div>
