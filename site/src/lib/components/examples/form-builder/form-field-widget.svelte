<script module lang="ts">
	export type FormFieldWidgetProps = {
		/** Passed in by the board registry's `componentProps`. */
		onSelect: (widget: FlexiWidgetController) => void;
		/** Reads the page's selection state — a getter, since `componentProps` is built once. */
		isSelected: (uid: string) => boolean;
	};
</script>

<script lang="ts">
	import { getFlexiwidgetCtx, type FlexiWidgetController } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import Grabber from '$lib/components/examples/common/grabber.svelte';
	import FieldPreview from './field-preview.svelte';
	import { FIELD_KIND, type FieldMeta } from './field-types.js';

	let { onSelect, isSelected }: FormFieldWidgetProps = $props();

	// The widget controller *is* the field: everything rendered below is read
	// straight off its metadata, so an inspector write re-renders this card.
	const widget = getFlexiwidgetCtx();

	const meta = $derived(widget.metadata as FieldMeta | undefined);
	const spec = $derived(meta ? FIELD_KIND[meta.kind] : undefined);
	const selected = $derived(!!meta && isSelected(meta.uid));
</script>

{#if meta && spec}
	<div class="flex w-full min-w-0 items-start gap-2">
		<!-- The only drag affordance. Its own z-layer, so it wins over the select button. -->
		<Grabber size={14} class="relative z-10 -ml-1 shrink-0" />

		<div class="min-w-0 flex-1">
			<div class="flex items-baseline justify-between gap-2">
				{#if meta.kind === 'section'}
					<h3 class="text-ink min-w-0 truncate font-serif text-[15px]">{meta.label}</h3>
				{:else}
					<span class="label text-ink min-w-0 truncate text-[10px]">
						{meta.label}{#if meta.required}<span class="text-fx-accent"> *</span>{/if}
					</span>
				{/if}
				<!-- The metadata story, told on the card instead of only in the JSON. -->
				<span
					class={cn(
						'hidden shrink-0 font-mono text-[10px] sm:inline',
						selected ? 'text-blue' : 'text-faint'
					)}>{meta.kind} · {meta.name}</span
				>
			</div>

			<!-- Rendered, never operable: the canvas is a design surface, not a form. -->
			<div class="pointer-events-none mt-2" aria-hidden="true">
				<FieldPreview {meta} />
			</div>
		</div>
	</div>

	<!--
		One full-bleed tab stop for selection, sitting under the grip. Clicking
		anywhere on the card (including "on" an inert input) selects the field.
	-->
	<button
		type="button"
		class="focus-visible:outline-blue absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2"
		aria-label={`Edit field: ${meta.label}`}
		onclick={() => onSelect(widget)}
	></button>
{/if}
