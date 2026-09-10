<script module lang="ts">
	export type FieldPreviewProps = {
		meta: FieldMeta;
	};
</script>

<script lang="ts">
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import type { FieldMeta } from './field-types.js';

	let { meta }: FieldPreviewProps = $props();

	// Inert, but rendered rather than faked: disabled native controls at full
	// opacity so the canvas reads as a form, not as a broken one.
	const control =
		'h-8 w-full rounded-[9px] border border-rule-soft bg-paper px-3 text-[13px] text-body placeholder:text-faint shadow-none outline-none disabled:cursor-default disabled:opacity-100';
</script>

{#if meta.kind === 'text' || meta.kind === 'email'}
	<input
		type={meta.kind === 'email' ? 'email' : 'text'}
		disabled
		placeholder={meta.placeholder}
		class={control}
	/>
{:else if meta.kind === 'textarea'}
	<textarea
		disabled
		rows={2}
		placeholder={meta.placeholder}
		class="border-rule-soft bg-paper text-body placeholder:text-faint min-h-14 w-full resize-none rounded-[9px] border px-3 py-2 text-[13px] shadow-none outline-none disabled:cursor-default disabled:opacity-100"
	></textarea>
{:else if meta.kind === 'select'}
	<!-- Native <select>, chevron drawn alongside it so the disabled control keeps
	     the same affordance the live one would have. -->
	<div class="relative w-full">
		<select disabled class={`${control} text-faint cursor-default appearance-none pr-8`}>
			<option>{meta.placeholder || 'Select an option'}</option>
		</select>
		<ChevronDown
			class="text-faint pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2"
		/>
	</div>
{:else if meta.kind === 'checkbox'}
	<div class="flex items-center gap-2">
		<input
			type="checkbox"
			disabled
			class="accent-ink border-rule-soft size-4 shrink-0 rounded-[4px] border disabled:cursor-default disabled:opacity-100"
		/>
		<span class="text-body truncate text-[13px]">{meta.label}</span>
	</div>
{:else if meta.kind === 'section'}
	<hr class="border-rule-soft border-t" />
{/if}
