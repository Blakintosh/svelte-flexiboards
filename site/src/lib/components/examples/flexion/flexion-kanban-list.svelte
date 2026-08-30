<script module lang="ts">
	type FlexionKanbanListProps = {
		category: string;
		categoryLabel: string;
		bgClass: string;
		dotClass: string;
		// Items carry a done flag; completed work is struck through, not hidden.
		items: { label: string; done?: boolean }[];
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
	} from '@flexiboards/svelte';
	import { twMerge } from 'tailwind-merge';

	let { category, categoryLabel, bgClass, dotClass, items }: FlexionKanbanListProps = $props();

	let adding = $state(false);
	let newItem = $state('');
	let target: FlexiTargetController | undefined = $state();

	let addInput: HTMLInputElement | undefined = $state();

	// Auto focus the add input when it's being added
	$effect(() => {
		if (addInput && adding) {
			addInput.focus();
		}
	});

	function onClickAdd() {
		adding = true;
	}

	function onClickAddItem() {
		adding = false;

		target!.createWidget({
			className: 'border border-rule bg-panel px-4 py-2 text-[13px] text-ink',
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

{#snippet widgetChildren({ widget }: FlexiWidgetChildrenSnippetParameters)}
	{widget.componentProps?.content}
{/snippet}

<FlexiTarget key={category} class="w-72 lg:w-48 2xl:w-64 gap-1" bind:controller={target}>
	{#snippet header({ target }: { target: FlexiTargetController })}
		<!-- Column headings are labels: mono, uppercase, with a square status tick. -->
		<div class="mb-4 flex items-center gap-4">
			<h3 class={twMerge('label inline-flex items-center gap-2 px-3 py-1 text-[10px]', bgClass)}>
				<div class={twMerge('size-2', dotClass)}></div>
				{categoryLabel}
			</h3>
			<span class="font-mono text-[11px] text-faint">{target.widgets.size}</span>
		</div>
	{/snippet}
	{#each items as item}
		<FlexiWidget
			class={(widget: FlexiWidgetController) => {
				return cn(
					'border border-rule bg-panel px-4 py-2 text-[13px] text-ink',
					item.done && 'text-faint line-through',
					widget.isGrabbed && 'border-fx-accent opacity-60',
					widget.isShadow && 'border-dashed border-fx-accent bg-tint-accent opacity-70'
				);
			}}
		>
			{item.label}
		</FlexiWidget>
	{/each}
	{#snippet footer({ target }: { target: FlexiTargetController })}
		{#if !adding}
			<Button onclick={onClickAdd} variant={'ghost'}>
				<Plus />
				Add
			</Button>
		{:else}
			<div class="mt-1 flex w-48 items-center gap-2 border border-rule bg-tint px-4 py-1 2xl:w-64">
				<Button onclick={cancelAddItem} variant={'ghost'} size={'icon'} class="size-4 shrink-0">
					<X />
				</Button>
				<input
					type="text"
					bind:this={addInput}
					bind:value={newItem}
					class="min-w-0 grow bg-transparent text-[13px] text-ink outline-none"
				/>
				<Button onclick={onClickAddItem} variant="link" size={'sm'} class="shrink-0">Add</Button>
			</div>
		{/if}
	{/snippet}
</FlexiTarget>

<svelte:window
	onkeydown={(event) => {
		if (!adding) {
			return;
		}

		if (event.key === 'Enter' && newItem.length) {
			onClickAddItem();
		} else if (event.key == 'Escape') {
			cancelAddItem();
		}
	}}
/>
