<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		cssTransitionConfig,
		immediateTriggerConfig,
		type AdderWidgetConfiguration,
		type FlexiBoardConfiguration,
		type FlexiBoardController,
		type FlexiRegistryEntry,
		type FlexiTargetController,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import type { FlexiBoardSuspenseReason } from '@flexiboards/svelte';
	import BoardSkeleton from '$lib/components/examples/common/board-skeleton.svelte';
	import Button from '$lib/components/examples/common/button.svelte';
	import { cn } from '$lib/utils.js';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';

	import FieldPalette from '$lib/components/examples/form-builder/field-palette.svelte';
	import FieldInspector from '$lib/components/examples/form-builder/field-inspector.svelte';
	import SchemaPanel from '$lib/components/examples/form-builder/schema-panel.svelte';
	import FormFieldWidget from '$lib/components/examples/form-builder/form-field-widget.svelte';
	import {
		FIELD_KINDS,
		defaultFields,
		uniqueName,
		type FieldEntry,
		type FieldKindSpec,
		type FieldMeta
	} from '$lib/components/examples/form-builder/field-types.js';

	let board: FlexiBoardController | undefined = $state();
	let canvasTarget: FlexiTargetController | undefined = $state();

	// `target.widgets` is a set whose identity never changes, so it can't be read
	// reactively through the adapter. The example snapshots it instead: this array
	// is what the count, the inspector and the JSON all read.
	let fields = $state.raw<FieldEntry[]>([]);
	let selectedUid: string | undefined = $state();

	const selectedField = $derived(fields.find((field) => field.uid === selectedUid));

	const duplicateNames = $derived.by(() => {
		const seen = new Set<string>();
		const duplicates = new Set<string>();

		for (const field of fields) {
			if (seen.has(field.meta.name)) {
				duplicates.add(field.meta.name);
			}
			seen.add(field.meta.name);
		}

		return duplicates;
	});

	// Blue is selection (persistent, board furniture); fx-accent stays reserved
	// for provisional things — the widget in hand and the drop preview.
	function fieldClass(widget: FlexiWidgetController) {
		const meta = widget.metadata as FieldMeta | undefined;

		return cn(
			'relative flex w-full min-w-0 flex-col rounded-[14px] border border-rule-soft bg-panel px-3.5 py-3 shadow-card transition-colors duration-[120ms]',
			meta && meta.uid === selectedUid && 'bg-tint ring-2 ring-inset ring-blue',
			widget.isGrabbed && ' opacity-95 shadow-lift',
			widget.isShadow &&
				'border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent shadow-none',
			widget.dropRejected && 'border-rule-soft opacity-30 saturate-0'
		);
	}

	function selectField(widget: FlexiWidgetController) {
		const meta = widget.metadata as FieldMeta | undefined;
		if (!meta) {
			return;
		}

		selectedUid = meta.uid;
		scrollInspectorIntoView();
	}

	// One registry entry per field kind, all generated from the same table the
	// palette and the inspector read.
	const registry: Record<string, FlexiRegistryEntry> = Object.fromEntries(
		FIELD_KINDS.map((spec) => [
			spec.kind,
			{
				component: FormFieldWidget,
				// A getter, not a value: `componentProps` is built once, so the card reads
				// the live selection through this closure.
				componentProps: { onSelect: selectField, isSelected: (uid: string) => uid === selectedUid },
				className: fieldClass,
				draggability: 'full',
				resizability: 'none',
				transition: cssTransitionConfig(),
				// The grip is a dedicated target that never needs to scroll, so the
				// default long-press-on-touch is pure friction here.
				grabTrigger: {
					default: immediateTriggerConfig(),
					mouse: immediateTriggerConfig(),
					touch: immediateTriggerConfig(),
					pen: immediateTriggerConfig()
				}
			} satisfies FlexiRegistryEntry
		])
	);

	const boardConfig: FlexiBoardConfiguration = {
		registry,
		widgetDefaults: { resizability: 'none' },
		loadLayout: () => ({ canvas: defaultFields() }),
		// A change *signal*, not the payload: it fires on drop and delete only,
		// debounced, so the schema is re-derived from metadata rather than from it.
		onLayoutChange: () => syncFields()
	};

	/**
	 * Snapshots the canvas into `fields`, ordered by the flow grid's row order.
	 */
	function syncFields(autoSelect = true) {
		const target = canvasTarget;
		if (!target) {
			return;
		}

		const next: FieldEntry[] = [...target.widgets]
			.filter((widget) => !widget.isShadow && (widget.metadata as FieldMeta | undefined)?.uid)
			.sort((a, b) => a.y - b.y || a.x - b.x)
			.map((widget) => {
				const meta = widget.metadata as FieldMeta;
				return { uid: meta.uid, widget, meta };
			});

		const previous = fields;
		fields = next;

		const added = autoSelect
			? next.find((field) => !previous.some((entry) => entry.uid === field.uid))
			: undefined;

		if (added) {
			selectField(added.widget as FlexiWidgetController);
		} else if (selectedUid && !next.some((field) => field.uid === selectedUid)) {
			selectedUid = undefined;
		}
	}

	/**
	 * `FlexiAdd` builds its widget directly — it neither forwards `type` nor reads
	 * the registry — so the entry is spread in by hand from the same table.
	 */
	function addWidget(spec: FieldKindSpec): AdderWidgetConfiguration {
		const meta = spec.defaults();
		meta.name = uniqueName(meta.name, new Set(fields.map((field) => field.meta.name)));

		return {
			widget: { ...registry[spec.kind], type: spec.kind, metadata: meta },
			widthPx: 320,
			heightPx: 72
		};
	}

	// Metadata is replaced, never mutated in place, so core is never handed a
	// Svelte `$state` proxy. The write triggers core, which re-renders the card.
	function updateField(patch: Partial<FieldMeta>) {
		const entry = selectedField;
		if (!entry) {
			return;
		}

		entry.widget.metadata = { ...entry.meta, ...patch };
		syncFields(false);
	}

	function resetForm() {
		selectedUid = undefined;
		board?.importLayout({ canvas: defaultFields() });
		syncFields(false);
	}

	let mainEl: HTMLElement | undefined = $state();
	let asideEl: HTMLElement | undefined = $state();

	// Below lg the panes are stacked, so a selection off-screen would be silent.
	// Scrolls this example's own `main` — never scrollIntoView(), which would
	// propagate out of the embed iframe.
	function scrollInspectorIntoView() {
		if (!mainEl || !asideEl || mainEl.scrollHeight <= mainEl.clientHeight) {
			return;
		}

		mainEl.scrollTo({ top: Math.max(0, asideEl.offsetTop - 12), behavior: 'smooth' });
	}

	// The target renders nothing until it is mounted and prepared, so the canvas
	// is legitimately empty on the server. `ready` keeps the count and the
	// empty-state overlay from claiming otherwise before the first sync.
	let ready = $state(false);
	let seeded = false;

	$effect(() => {
		if (canvasTarget && !seeded) {
			seeded = true;
			syncFields(false);
			ready = true;
		}
	});
</script>

<main
	bind:this={mainEl}
	class="bg-paper relative flex h-full min-h-0 w-full flex-col gap-4 px-4 py-4 max-lg:overflow-y-auto lg:gap-6 lg:overflow-hidden lg:px-8 lg:py-6"
>
	<header class="flex shrink-0 items-baseline justify-between gap-4">
		<div class="flex items-baseline gap-3">
			<h1 class="text-ink font-serif text-2xl lg:text-[30px]">Form builder</h1>
			<span class="text-faint hidden text-[11.5px] font-semibold sm:inline">
				1 col · flow · metadata
			</span>
		</div>
		<Button
			variant="outline"
			size="sm"
			class="rounded-full"
			onclick={resetForm}
			title="Reset the form"
		>
			<RotateCcw class="size-3.5" />
			<span class="max-sm:sr-only">Reset</span>
		</Button>
	</header>

	<!-- Below lg nothing is height-constrained: the panes stack at their natural
	     height and `main` is the only scroller. -->
	<div class="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-6">
		<FlexiBoard
			config={boardConfig}
			bind:controller={board}
			class="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-5"
		>
			{#snippet suspense(_: FlexiBoardSuspenseReason)}
				<BoardSkeleton bars={4} class="" />
			{/snippet}
			<FieldPalette onAdd={addWidget} />

			<!-- The canvas is the page's one lifted card: it is the figure. -->
			<section
				class="border-rule-soft bg-panel shadow-card flex flex-col overflow-hidden rounded-[14px] border lg:min-h-0 lg:flex-1"
			>
				<header
					class="border-rule-faint flex shrink-0 items-baseline justify-between gap-3 border-b px-4 py-3"
				>
					<h2 class="text-ink font-serif text-[15px]">Contact form</h2>
					<span class="text-faint text-[11.5px] font-semibold">
						{#if ready}
							{fields.length}
							{fields.length === 1 ? 'field' : 'fields'}
						{/if}
					</span>
				</header>

				<!--
					overflow-x-clip, as in the dashboard example: a widget interpolating to
					its new row is absolutely positioned and briefly widens the grid, which
					would otherwise flash a horizontal scrollbar.
				-->
				<div
					class="relative overflow-x-clip max-lg:min-h-[360px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
				>
					<FlexiTarget
						key="canvas"
						bind:controller={canvasTarget}
						containerClass="min-h-[360px] lg:min-h-full"
						class="min-h-[360px] content-start gap-3 p-4 lg:min-h-full"
						config={{
							layout: {
								type: 'flow',
								flowAxis: 'row',
								placementStrategy: 'append',
								columns: 1
							}
						}}
					/>

					{#if ready && fields.length === 0}
						<div
							class="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center"
						>
							<p class="text-faint text-[11.5px] font-semibold">Drag a field in to begin</p>
						</div>
					{/if}
				</div>
			</section>
		</FlexiBoard>

		<aside
			bind:this={asideEl}
			class="flex flex-col gap-4 sm:flex-row sm:gap-5 lg:min-h-0 lg:w-80 lg:shrink-0 lg:flex-col lg:gap-4 xl:w-96"
		>
			<FieldInspector field={selectedField} {duplicateNames} onchange={updateField} />
			<SchemaPanel {fields} {selectedUid} />
		</aside>
	</div>
</main>
