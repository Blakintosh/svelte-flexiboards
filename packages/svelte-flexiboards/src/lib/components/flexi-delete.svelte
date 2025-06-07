<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import {
		flexidelete,
		FlexiDeleteController,
		type FlexiDeleteClasses
	} from '$lib/system/manage.svelte.js';
	import { assistiveTextStyle, generateUniqueId } from '$lib/system/shared/utils.svelte.js';

	/** @deprecated FlexiDelete's children props are now redundant and will be removed in v0.4. */
	type FlexiDeleteChildrenProps = {
		/**
		 * @deprecated This has been replaced with internal pointer management and is redundant. These events will be removed in v0.4.
		 */
		onpointerenter: (event: PointerEvent) => void;
		/**
		 * @deprecated This has been replaced with internal pointer management and is redundant. These events will be removed in v0.4.
		 */
		onpointerleave: (event: PointerEvent) => void;
	};

	export type FlexiDeleteProps = FlexiCommonProps<FlexiDeleteController> & {
		class?: FlexiDeleteClasses;
		children?: Snippet<[{ deleter: FlexiDeleteController; props: FlexiDeleteChildrenProps }]>;
	};
</script>

<script lang="ts">
	let {
		class: className,
		children,
		controller = $bindable(),
		onfirstcreate
	}: FlexiDeleteProps = $props();

	// TODO: remove pointer events in v0.4
	const { deleter, onpointerenter, onpointerleave } = flexidelete();
	controller = deleter;
	onfirstcreate?.(deleter);

	let derivedClassName = $derived.by(() => {
		if (!deleter) {
			return '';
		}

		if (typeof className === 'function') {
			return className(deleter);
		}

		return className;
	});

	let assistiveTextId = generateUniqueId();
</script>

<div
	role="region"
	bind:this={deleter.ref}
	class={derivedClassName}
	aria-describedby={assistiveTextId}
>
	<span style={assistiveTextStyle} id={assistiveTextId}>
		Drag a widget here and press Enter to delete it.
	</span>
	{@render children?.({ deleter, props: { onpointerenter, onpointerleave } })}
</div>
