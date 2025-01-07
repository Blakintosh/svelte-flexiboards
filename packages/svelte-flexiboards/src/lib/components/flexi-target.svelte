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
		footer?: Snippet;
		containerClass?: string;
		class?: string;
		name?: string;
		config?: FlexiTargetConfiguration;
	};
</script>

<script lang="ts">
	import FlexiWidget from './flexi-widget.svelte';
	import FlexiWidgetWrapper from './flexi-widget-wrapper.svelte';
	import FlexiGrid from './flexi-grid.svelte';

	let {
		children,
		class: className,
		header,
		footer,
		config,
		containerClass,
		this: _thisTarget = $bindable(),
		onfirstcreate
	}: FlexiTargetProps = $props();

	const { onpointerenter, onpointerleave, target } = flexitarget(config);

	// Target created, allow the caller to access it.
	_thisTarget = target;
	onfirstcreate?.(target);

	let rendered = $derived(false);
</script>

<div>
	<div class={containerClass} {onpointerenter} {onpointerleave} role="grid" tabindex={0}>
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
</div>
