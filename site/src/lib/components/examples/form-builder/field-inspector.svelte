<script module lang="ts">
	export type FieldInspectorProps = {
		field: FieldEntry | undefined;
		/** Keys used by more than one field — warned about, never blocked. */
		duplicateNames: Set<string>;
		onchange: (patch: Partial<FieldMeta>) => void;
	};
</script>

<script lang="ts">
	import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
	import { FIELD_KIND, slugify, type FieldEntry, type FieldMeta } from './field-types.js';

	let { field, duplicateNames, onchange }: FieldInspectorProps = $props();

	const spec = $derived(field ? FIELD_KIND[field.meta.kind] : undefined);
	const controls = $derived(new Set(spec?.inspector ?? []));

	// Local drafts for the two controls that must not be rewritten mid-keystroke:
	// the key (sanitised on commit) and the options list (line-based).
	let nameDraft = $state('');
	let optionsDraft = $state('');
	let seededUid: string | undefined = undefined;

	$effect(() => {
		const uid = field?.uid;
		if (uid === seededUid) {
			return;
		}

		seededUid = uid;
		nameDraft = field?.meta.name ?? '';
		optionsDraft = (field?.meta.options ?? []).join('\n');
	});

	const isDuplicate = $derived(!!field && duplicateNames.has(field.meta.name));

	// Native controls on the site tokens — the example depends on Tailwind and
	// the tokens only, no component library.
	const inputClass =
		'h-8 w-full rounded-[9px] border border-rule-soft bg-paper px-3 text-[13px] text-ink placeholder:text-faint shadow-none outline-none transition-[border-color] duration-[120ms] focus-visible:border-blue';

	const labelClass = 'text-faint text-[11.5px] font-semibold';

	// A checkbox painted as a toggle: real input, real semantics, Tailwind-only
	// track and thumb.
	const switchClass =
		'relative h-[18px] w-8 shrink-0 cursor-pointer appearance-none rounded-full bg-rule outline-none transition-colors duration-[130ms] before:absolute before:top-[2px] before:left-[2px] before:size-[14px] before:rounded-full before:bg-paper before:shadow-sm before:transition-transform before:duration-[130ms] before:content-[""] checked:bg-blue checked:before:translate-x-[14px] focus-visible:ring-[3px] focus-visible:ring-ring/50';

	function commitName() {
		const next = slugify(nameDraft);
		nameDraft = next;
		if (field && next !== field.meta.name) {
			onchange({ name: next });
		}
	}

	function commitOptions(value: string) {
		optionsDraft = value;
		onchange({
			options: value
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0)
		});
	}
</script>

<section class="flex min-w-0 flex-col gap-2 sm:flex-1 lg:flex-none">
	<span class="text-faint text-[11.5px] font-semibold">Field</span>

	<div class="border-rule-soft bg-panel shadow-card rounded-[14px] border p-4">
		{#if !field || !spec}
			<div class="flex flex-col items-center justify-center gap-2 py-6 text-center">
				<SlidersHorizontal class="text-faint size-5" />
				<p class="text-faint text-[11.5px] font-semibold">Select a field to edit it</p>
			</div>
		{:else}
			{@const uid = field.uid}
			<div class="flex flex-col gap-3">
				<span class="bg-tint text-ink w-fit rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
					>{spec.title}</span
				>

				{#if controls.has('label')}
					<div class="flex flex-col gap-1">
						<label for={`${uid}-label`} class={labelClass}>Label</label>
						<input
							id={`${uid}-label`}
							value={field.meta.label}
							class={inputClass}
							oninput={(event) => onchange({ label: event.currentTarget.value })}
						/>
					</div>
				{/if}

				{#if controls.has('name')}
					<div class="flex flex-col gap-1">
						<label for={`${uid}-name`} class={labelClass}>Key</label>
						<input
							id={`${uid}-name`}
							bind:value={nameDraft}
							class={`${inputClass} font-mono`}
							onblur={commitName}
							onkeydown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									commitName();
								}
							}}
						/>
						{#if isDuplicate}
							<p class="text-fx-accent text-[11.5px] font-semibold">Key already used</p>
						{:else}
							<p class="text-faint text-[11.5px] font-semibold">lowercase · no spaces</p>
						{/if}
					</div>
				{/if}

				{#if controls.has('placeholder')}
					<div class="flex flex-col gap-1">
						<label for={`${uid}-placeholder`} class={labelClass}>Placeholder</label>
						<input
							id={`${uid}-placeholder`}
							value={field.meta.placeholder ?? ''}
							class={inputClass}
							oninput={(event) => onchange({ placeholder: event.currentTarget.value })}
						/>
					</div>
				{/if}

				{#if controls.has('options')}
					<div class="flex flex-col gap-1">
						<label for={`${uid}-options`} class={labelClass}>Options</label>
						<textarea
							id={`${uid}-options`}
							value={optionsDraft}
							rows={3}
							class="border-rule-soft bg-paper text-ink focus-visible:border-blue min-h-16 w-full resize-none rounded-[9px] border px-3 py-2 text-[13px] shadow-none outline-none"
							oninput={(event) => commitOptions(event.currentTarget.value)}
						></textarea>
						<p class="text-faint text-[11.5px] font-semibold">one per line</p>
					</div>
				{/if}

				{#if controls.has('required')}
					<div class="border-rule-faint flex items-center justify-between gap-3 border-t pt-3">
						<label for={`${uid}-required`} class={labelClass}>Required</label>
						<input
							id={`${uid}-required`}
							type="checkbox"
							role="switch"
							aria-checked={field.meta.required ?? false}
							checked={field.meta.required ?? false}
							class={switchClass}
							onchange={(event) => onchange({ required: event.currentTarget.checked })}
						/>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>
