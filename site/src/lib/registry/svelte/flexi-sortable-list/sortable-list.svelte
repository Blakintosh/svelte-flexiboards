<script lang="ts">
	import Root from './root.svelte';
	import Item from './item.svelte';
	import Grabber from '../flexi-handles/grabber.svelte';
	let {
		items,
		class: className,
		onreorder
	}: {
		items: { id: string; label: string }[];
		class?: string;
		onreorder?: (ids: string[]) => void;
	} = $props();
</script>

<Root class={className} {onreorder}>
	{#each items as item (item.id)}
		<Item id={item.id}
			><Grabber label={`Move ${item.label}`} /><span class="min-w-0 flex-1 truncate"
				>{item.label}</span
			></Item
		>
	{/each}
</Root>
