<script module lang="ts">
	import { assistiveTextStyle, generateUniqueId, type FlexiCommonProps, type FlexiDeleteClasses, type FlexiDeleteController } from '@flexiboards/core';
	import type { Snippet } from 'svelte';
	import { flexidelete } from '../adapters/misc.js';
	import { fromCore, reactive } from '../adapter.svelte.js';

	export type FlexiDeleteProps = FlexiCommonProps<FlexiDeleteController> & {
		class?: FlexiDeleteClasses;
		children?: Snippet<[{ deleter: FlexiDeleteController }]>;
	};
</script>

<script lang="ts">
	let {
		class: className,
		children,
		controller = $bindable(),
		onfirstcreate
	}: FlexiDeleteProps = $props();

	const { deleter } = flexidelete();
	const publicDeleter = reactive(deleter);
	controller = publicDeleter;
	onfirstcreate?.(publicDeleter);

	// fromCore: the user's class function may read signal-backed state (e.g. deleter.isHovered).
	let derivedClassName = $derived.by(
		fromCore(() => {
			if (typeof className === 'function') {
				return className(deleter);
			}

			return className;
		})
	);

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
	{@render children?.({ deleter: publicDeleter })}
</div>
