<script module lang="ts">
	export type FieldPaletteProps = {
		/** Builds the widget that `FlexiAdd` drags into the board. */
		onAdd: (spec: FieldKindSpec) => AdderWidgetConfiguration;
	};
</script>

<script lang="ts">
	import {
		FlexiAdd,
		FlexiDelete,
		type AdderWidgetConfiguration,
		type FlexiDeleteController
	} from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import { FIELD_KINDS, type FieldKind, type FieldKindSpec } from './field-types.js';

	import Type from 'lucide-svelte/icons/type';
	import AtSign from 'lucide-svelte/icons/at-sign';
	import AlignLeft from 'lucide-svelte/icons/align-left';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import SquareCheck from 'lucide-svelte/icons/square-check';
	import Heading from 'lucide-svelte/icons/heading';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	let { onAdd }: FieldPaletteProps = $props();

	// Icons live here, not in field-types.ts, so the data model stays portable.
	const ICONS: Record<FieldKind, typeof Type> = {
		text: Type,
		email: AtSign,
		textarea: AlignLeft,
		select: ChevronDown,
		checkbox: SquareCheck,
		section: Heading
	};
</script>

<div class="flex shrink-0 flex-col gap-2 lg:w-52">
	<span class="text-faint text-[11.5px] font-semibold">Fields</span>

	<!--
		Wrapped, not scrolled: FlexiAdd sets touch-action:none on its button, so a
		horizontal scroll strip would swallow touch drags instead of starting them.
	-->
	<div class="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
		{#each FIELD_KINDS as spec (spec.kind)}
			{@const Icon = ICONS[spec.kind]}
			<FlexiAdd
				addWidget={() => onAdd(spec)}
				class={'ui text-xs border-rule-soft bg-tint-2 text-body hover:bg-panel hover:text-ink hover:shadow-card focus-visible:outline-blue flex flex-1 basis-[calc(50%-0.25rem)] items-center gap-2 rounded-[10px] border px-2.5 py-2.5 text-left transition-all duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 sm:basis-[calc(33.333%-0.4rem)] lg:basis-auto'}
			>
				<GripVertical class="text-faint size-3 shrink-0" />
				<Icon class="text-blue size-3.5 shrink-0" />
				<span class="min-w-0 truncate">{spec.title}</span>
			</FlexiAdd>
		{/each}
	</div>

	<!--
		The warning arrives before the release, which is the only confirmation this
		action gets. `deleter.isHovered` rather than CSS :hover, so the keyboard
		pointer lights it up too.
	-->
	<FlexiDelete
		class={(deleter: FlexiDeleteController) =>
			cn(
				'ui text-xs border-rule-soft bg-tint-2 text-faint flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed px-3 py-3 text-center transition-colors duration-[120ms] lg:mt-auto lg:flex-col lg:py-6',
				deleter.isHovered && 'border-fx-accent/70 bg-tint-accent text-fx-accent'
			)}
	>
		<Trash2 class="size-4 shrink-0 lg:size-6" />
		Drop to remove
	</FlexiDelete>
</div>
