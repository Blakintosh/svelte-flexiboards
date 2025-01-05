<script module lang="ts">
	type FlexionKanbanListProps = {
		category: string;
		categoryLabel: string;
		bgClass: string;
		dotClass: string;
		items: string[];
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	import { FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import { twMerge } from 'tailwind-merge';

	let { category, categoryLabel, bgClass, dotClass, items }: FlexionKanbanListProps = $props();
</script>

<FlexiTarget name={category} class="w-64 gap-1">
	{#snippet header({ target })}
		<div class="mb-4 flex items-center gap-4 text-muted-foreground">
			<h3
				class={twMerge(
					'inline-flex items-center gap-2 rounded-full bg-green-300 px-3 py-1 text-sm text-black',
					bgClass
				)}
			>
				<div class={twMerge('size-3 rounded-full bg-green-500', dotClass)}></div>
				{categoryLabel}
			</h3>
			{target.widgets.size}
		</div>
	{/snippet}
	{#each items as item}
		<FlexiWidget
			class={(widget) => {
				return cn(
					'rounded-lg bg-muted px-4 py-2',
					widget.grabbed && 'animate-pulse opacity-50',
					widget.isShadow && 'opacity-40'
				);
			}}>{item}</FlexiWidget
		>
	{/each}
</FlexiTarget>
