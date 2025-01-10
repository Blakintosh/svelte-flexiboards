<script module lang="ts">
	import type { Snippet } from 'svelte';
	import {
		flexitarget,
		type FlexiTargetConfiguration,
		type FlexiTarget as FlexiTargetController
	} from '$lib/system/target.svelte.js';
	import type { FlexiCommonProps } from '$lib/system/types.js';

	export type FlexiTargetProps = FlexiCommonProps<FlexiTargetController> & {
		header?: Snippet<[{ target: FlexiTargetController }]>;
		children?: Snippet;
		footer?: Snippet<[{ target: FlexiTargetController }]>;
		containerClass?: string;
		class?: string;
		name?: string;
		config?: FlexiTargetConfiguration;
		key?: string;
	};
</script>

<script lang="ts">
	import FlexiGrid from './flexi-grid.svelte';
	import FlexiTargetLoader from './flexi-target-loader.svelte';
	import RenderedFlexiWidget from './rendered-flexi-widget.svelte';

	let {
		children,
		class: className,
		header,
		footer,
		config,
		containerClass,
		controller = $bindable(),
		key,
		onfirstcreate
	}: FlexiTargetProps = $props();

	const { onpointerenter, onpointerleave, target } = flexitarget(config, key);

	// Target created, allow the caller to access it.
	controller = target;
	onfirstcreate?.(target);
</script>

<div>
	<div class={containerClass} {onpointerenter} {onpointerleave} role="grid" tabindex={0}>
		{@render header?.({ target })}

		<!-- Allow user to specify components directly via a registration component. Once that's done, mount them to the actual target list dynamically -->
		<FlexiGrid class={className}>
			{#if !target.prepared && children}
				{@render children()}
			{:else if target.prepared}
				{#each target.widgets as widget (widget)}
					<RenderedFlexiWidget {widget} />
				{/each}
			{/if}
		</FlexiGrid>
		{@render footer?.({ target })}
	</div>
</div>

<FlexiTargetLoader />
