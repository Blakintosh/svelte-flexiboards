<script module lang="ts">
	import { onMount, untrack, type Component, type Snippet } from 'svelte';
	import {
		FlexiResize,
		FlexiWidget,
		getFlexiwidgetCtx,
		type FlexiWidgetProps
	} from '@flexiboards/svelte';
	import { getFlexspressiveEditor } from './index.svelte';
	import { cn } from '$lib/utils';

	export type TileProps = FlexiWidgetProps & {
		title: string;
		on: boolean;
		onIcon?: any;
		offIcon?: any;
	};
</script>

<script lang="ts">
	let { title, on = $bindable(), onIcon: Icon, offIcon: OffIcon, ...props }: TileProps = $props();

	const editor = getFlexspressiveEditor();
	const widget = getFlexiwidgetCtx();

	let editMode = $derived(editor.editMode);
	let editingTile = $state(false);

	$effect(() => {
		if (!editMode) {
			untrack(() => {
				editingTile = false;

				widget.resizability = 'none';
				widget.draggability = 'movable';
			});
		}
	});

	function onclick() {
		if (!editMode) {
			on = !on;
			return;
		}
		if (editingTile) {
			return;
		}

		editingTile = true;
		widget.resizability = 'horizontal';
		widget.draggability = 'full';
	}

	let node: HTMLElement;

	function clickOutsideHandler(event: MouseEvent) {
		if (editingTile && !node.contains(event.target as Node)) {
			editingTile = false;
			widget.resizability = 'none';
			widget.draggability = 'movable';
		}
	}

	onMount(() => {
		document.addEventListener('click', clickOutsideHandler, true);

		return () => {
			document.removeEventListener('click', clickOutsideHandler, true);
		};
	});
</script>

<!--
    State is a fill, never a colour swap: on is ink, off is a tinted card, and the
    fill survives edit mode so both readings stay legible at once. The tile being
    edited takes the fx-accent dashed frame; the tile in hand takes the lifted-card
    look instead, and the placeholder left behind takes the same dashed frame.
-->
<button
	class={cn(
		'relative grid h-full w-full cursor-pointer place-items-center justify-items-center rounded-[14px] transition-[color,background-color,border-color,rotate] duration-[120ms] motion-reduce:transition-none',
		on && !editingTile && 'bg-ink text-paper shadow-card',
		!on && !editingTile && 'border-rule-soft bg-tint text-body shadow-card border',
		editingTile &&
			'border-fx-accent/60 bg-tint-accent text-fx-accent-hover shadow-card border-[1.5px] border-dashed',
		widget.isGrabbed && 'shadow-lift bg-panel text-ink rotate-[2.5deg] border-0',
		widget.isShadow &&
			'border-fx-accent/50 bg-tint-accent text-fx-accent-hover border-[1.5px] border-dashed shadow-none'
	)}
	{onclick}
	bind:this={node}
>
	<span class="sr-only">Toggle {title}</span>
	<div
		class={[
			widget.width == 2 && 'flex w-full items-center gap-2.5 px-3',
			widget.width == 1 && 'flex w-full items-center justify-center px-3',
			'min-w-0'
		]}
	>
		{#if Icon}
			<div class="size-[18px] [&>svg]:size-[18px]">
				{#if on}
					<Icon />
				{:else}
					<OffIcon />
				{/if}
			</div>
		{/if}
		{#if widget.width == 2}
			<h4 class="truncate text-[11px] font-semibold">{title}</h4>
		{/if}
	</div>

	<!-- Resize handle when editing tile -->
	{#if editingTile}
		<FlexiResize
			class="absolute right-0 top-[50%] grid translate-x-[50%] translate-y-[-50%] place-items-center p-2 lg:p-0"
		>
			<span class="bg-fx-accent pointer-events-none block h-4 w-1.5 rounded-full"></span>
		</FlexiResize>
	{/if}
</button>
