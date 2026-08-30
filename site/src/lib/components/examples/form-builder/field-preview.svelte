<script module lang="ts">
	export type FieldPreviewProps = {
		meta: FieldMeta;
	};
</script>

<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { FieldMeta } from './field-types.js';

	let { meta }: FieldPreviewProps = $props();

	// Inert, but rendered rather than faked: disabled controls at full opacity so
	// the canvas reads as a form, not as a broken one.
	const control =
		'h-8 w-full rounded-none border-rule bg-paper text-[13px] text-body shadow-none disabled:cursor-default disabled:opacity-100';
</script>

{#if meta.kind === 'text' || meta.kind === 'email'}
	<Input
		type={meta.kind === 'email' ? 'email' : 'text'}
		disabled
		placeholder={meta.placeholder}
		class={control}
	/>
{:else if meta.kind === 'textarea'}
	<Textarea
		disabled
		rows={2}
		placeholder={meta.placeholder}
		class="border-rule bg-paper text-body min-h-14 w-full resize-none rounded-none text-[13px] shadow-none disabled:cursor-default disabled:opacity-100"
	/>
{:else if meta.kind === 'select'}
	<Select.Root type="single" disabled>
		<Select.Trigger class={control}>
			<span class="text-faint truncate">{meta.placeholder || 'Select an option'}</span>
		</Select.Trigger>
	</Select.Root>
{:else if meta.kind === 'checkbox'}
	<div class="flex items-center gap-2">
		<Checkbox
			disabled
			class="border-rule size-4 shrink-0 rounded-none disabled:cursor-default disabled:opacity-100"
		/>
		<span class="text-body truncate text-[13px]">{meta.label}</span>
	</div>
{:else if meta.kind === 'section'}
	<Separator class="bg-rule" />
{/if}
