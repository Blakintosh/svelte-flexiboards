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
	import { Button } from '$lib/components/ui/button';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';

	import {
		FlexiAdd,
		FlexiTarget,
		FlexiWidget,
		type FlexiTargetController,
		type FlexiWidgetChildrenSnippet,
		type FlexiWidgetChildrenSnippetParameters,
		type FlexiWidgetController
	} from 'svelte-flexiboards';
	import { twMerge } from 'tailwind-merge';

	let { category, categoryLabel, bgClass, dotClass, items }: FlexionKanbanListProps = $props();

	let adding = $state(false);
	let newItem = $state('');
	let target: FlexiTargetController | undefined = $state();

	function onClickAdd() {
		adding = true;
	}

	function onClickAddItem() {
		adding = false;

		target!.createWidget({
			className: 'bg-muted px-4 py-2 rounded-lg',
			snippet: widgetChildren,
			componentProps: {
				content: newItem
			}
		});
		newItem = '';
	}

	function cancelAddItem() {
		adding = false;
		newItem = '';
	}
</script>

{#snippet widgetChildren({ componentProps }: FlexiWidgetChildrenSnippetParameters)}
	{componentProps?.content}
{/snippet}

<FlexiTarget name={category} class="w-64 gap-1" bind:controller={target}>
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
			class={(widget: FlexiWidgetController) => {
				return cn(
					'rounded-lg bg-muted px-4 py-2',
					widget.isGrabbed && 'animate-pulse opacity-50',
					widget.isShadow && 'opacity-40'
				);
			}}
		>
			{item}
		</FlexiWidget>
	{/each}
	{#snippet footer({ target })}
		{#if !adding}
			<Button onclick={onClickAdd} variant={'ghost'}>
				<Plus />
				Add
			</Button>
		{:else}
			<!-- TODO: Make this not look awful -->
			<Button onclick={cancelAddItem} variant={'ghost'} size={'icon'}>
				<X />
			</Button>
			<input type="text" bind:value={newItem} />
			<Button onclick={onClickAddItem}>Add</Button>
		{/if}
	{/snippet}
</FlexiTarget>
