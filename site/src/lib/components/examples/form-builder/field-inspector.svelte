<script module lang="ts">
	export type FieldInspectorProps = {
		field: FieldEntry | undefined;
		/** Keys used by more than one field — warned about, never blocked. */
		duplicateNames: Set<string>;
		onchange: (patch: Partial<FieldMeta>) => void;
	};
</script>

<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
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

	const inputClass =
		'h-8 w-full rounded-none border-rule bg-paper text-[13px] text-ink shadow-none focus-visible:border-blue focus-visible:ring-0';

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
	<span class="label text-faint text-[10px]">Field</span>

	<div class="border-rule bg-panel border p-3">
		{#if !field || !spec}
			<div class="flex flex-col items-center justify-center gap-2 py-6 text-center">
				<SlidersHorizontal class="text-rule size-5" />
				<p class="label text-faint text-[10px]">Select a field to edit it</p>
			</div>
		{:else}
			{@const uid = field.uid}
			<div class="flex flex-col gap-3">
				<Badge variant="secondary" class="w-fit">{spec.title}</Badge>

				{#if controls.has('label')}
					<div class="flex flex-col gap-1">
						<Label for={`${uid}-label`} class="label text-faint text-[10px]">Label</Label>
						<Input
							id={`${uid}-label`}
							value={field.meta.label}
							class={inputClass}
							oninput={(event) => onchange({ label: event.currentTarget.value })}
						/>
					</div>
				{/if}

				{#if controls.has('name')}
					<div class="flex flex-col gap-1">
						<Label for={`${uid}-name`} class="label text-faint text-[10px]">Key</Label>
						<Input
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
							<p class="label text-fx-accent text-[10px]">Key already used</p>
						{:else}
							<p class="label text-faint text-[10px]">lowercase · no spaces</p>
						{/if}
					</div>
				{/if}

				{#if controls.has('placeholder')}
					<div class="flex flex-col gap-1">
						<Label for={`${uid}-placeholder`} class="label text-faint text-[10px]">
							Placeholder
						</Label>
						<Input
							id={`${uid}-placeholder`}
							value={field.meta.placeholder ?? ''}
							class={inputClass}
							oninput={(event) => onchange({ placeholder: event.currentTarget.value })}
						/>
					</div>
				{/if}

				{#if controls.has('options')}
					<div class="flex flex-col gap-1">
						<Label for={`${uid}-options`} class="label text-faint text-[10px]">Options</Label>
						<Textarea
							id={`${uid}-options`}
							value={optionsDraft}
							rows={3}
							class="border-rule bg-paper text-ink focus-visible:border-blue min-h-16 w-full resize-none rounded-none text-[13px] shadow-none focus-visible:ring-0"
							oninput={(event) => commitOptions(event.currentTarget.value)}
						/>
						<p class="label text-faint text-[10px]">one per line</p>
					</div>
				{/if}

				{#if controls.has('required')}
					<div class="border-rule flex items-center justify-between gap-3 border-t pt-3">
						<Label for={`${uid}-required`} class="label text-faint text-[10px]">Required</Label>
						<Switch
							id={`${uid}-required`}
							checked={field.meta.required ?? false}
							onCheckedChange={(checked: boolean) => onchange({ required: checked })}
						/>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>
