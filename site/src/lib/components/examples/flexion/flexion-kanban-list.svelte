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
	import Button from '$lib/components/examples/common/button.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';

	import {
		FlexiTarget,
		FlexiWidget,
		type FlexiTargetController,
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
			className:
				'rounded-[10px] border border-rule-soft bg-panel px-4 py-2 text-[13px] text-ink shadow-card',
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

<FlexiTarget key={category} class="w-72 gap-1 lg:w-48 2xl:w-64" bind:controller={target}>
	{#snippet header({ target }: { target: FlexiTargetController })}
		<!-- Column headings are status chips: rounded pill, tinted fill, round dot. -->
		<div class="mb-4 flex items-center gap-4">
			<h3
				class={twMerge(
					'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold',
					bgClass
				)}
			>
				<div class={twMerge('size-1.5 rounded-full', dotClass)}></div>
				{categoryLabel}
			</h3>
			<span class="text-faint font-mono text-[11px]">{target.widgets.size}</span>
		</div>
	{/snippet}
	{#each items as item}
		<FlexiWidget
			class={(widget: FlexiWidgetController) => {
				return cn(
					'border-rule-soft bg-panel text-ink shadow-card rounded-[10px] border px-4 py-2 text-[13px]',
					item.done && 'text-faint line-through',
					widget.isGrabbed && ' border-rule-soft shadow-lift opacity-60',
					widget.isShadow &&
						'border-fx-accent/50 bg-tint-accent rounded-[14px] border-[1.5px] border-dashed'
				);
			}}
		>
			{item.label}
		</FlexiWidget>
	{/each}
	{#snippet footer()}
		{#if !adding}
			<Button onclick={onClickAdd} variant={'ghost'} class="rounded-full">
				<Plus />
				Add
			</Button>
		{:else}
			<div
				class="border-rule-soft bg-tint mt-1 flex w-48 items-center gap-2 rounded-[10px] border px-4 py-1 2xl:w-64"
			>
				<Button
					onclick={cancelAddItem}
					variant={'ghost'}
					size={'icon'}
					class="size-4 shrink-0 rounded-full"
				>
					<X />
				</Button>
				<input
					type="text"
					bind:this={addInput}
					bind:value={newItem}
					class="text-ink min-w-0 grow bg-transparent text-[13px] outline-none"
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
