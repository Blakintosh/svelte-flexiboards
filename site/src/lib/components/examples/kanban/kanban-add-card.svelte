<script module lang="ts">
	export type KanbanAddCardProps = {
		/** Human-readable column name, used for the input's label. */
		column: string;
		/** Called with a non-empty, trimmed title. */
		onAdd: (title: string) => void;
	};
</script>

<script lang="ts">
	import Button from '$lib/components/examples/common/button.svelte';
	import { fieldClass } from '$lib/components/examples/common/button-classes.js';
	import Plus from 'lucide-svelte/icons/plus';
	import X from 'lucide-svelte/icons/x';

	let { column, onAdd }: KanbanAddCardProps = $props();

	let open = $state(false);
	let value = $state('');
	let input = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open) input?.focus();
	});

	function commit() {
		const title = value.trim();
		if (!title) return;
		onAdd(title);
		value = '';
		open = false;
	}

	function cancel() {
		value = '';
		open = false;
	}

	// The board listens for Enter (grab/drop) and Escape (cancel) too, so the
	// composer swallows both rather than letting a typed Enter reach a widget.
	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			commit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			cancel();
		}
	}
</script>

{#if open}
	<div class="border-rule-soft bg-panel mt-2 flex items-center gap-1 rounded-[10px] border p-1">
		<input
			bind:this={input}
			bind:value
			{onkeydown}
			placeholder="Card title"
			aria-label="New card in {column}"
			class="{fieldClass} h-7 border-0 bg-transparent px-1.5 text-[13px] shadow-none focus-visible:ring-0"
		/>
		<Button size="sm" class="h-7 shrink-0 rounded-full px-2 text-[11px]" onclick={commit}
			>Add</Button
		>
		<Button
			variant="ghost"
			size="icon"
			class="size-7 shrink-0 rounded-full"
			onclick={cancel}
			title="Cancel"
		>
			<X class="size-4" />
			<span class="sr-only">Cancel adding a card to {column}</span>
		</Button>
	</div>
{:else}
	<Button
		variant="ghost"
		size="sm"
		class="text-faint hover:bg-rule-faint hover:text-ink mt-2 h-7 w-full justify-start gap-1.5 rounded-[9px] px-1.5"
		onclick={() => (open = true)}
	>
		<Plus class="size-3.5" />
		<span class="ui text-xs">Add card</span>
		<span class="sr-only">to {column}</span>
	</Button>
{/if}
