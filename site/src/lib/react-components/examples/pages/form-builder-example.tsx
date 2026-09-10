import { FlexiBoard, FlexiTarget, cssTransitionConfig, immediateTriggerConfig } from '@flexiboards/react';
import type {
	AdderWidgetConfiguration,
	FlexiBoardConfiguration,
	FlexiBoardController,
	FlexiRegistryEntry,
	FlexiTargetController,
	FlexiWidgetController
} from '@flexiboards/react';
import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '$lib/utils.js';
import Button from '../common/button';
import FieldInspector from '../form-builder/field-inspector';
import FieldPalette from '../form-builder/field-palette';
import FormFieldWidget from '../form-builder/form-field-widget';
import SchemaPanel from '../form-builder/schema-panel';
import {
	FIELD_KINDS,
	defaultFields,
	uniqueName,
	type FieldEntry,
	type FieldKindSpec,
	type FieldMeta
} from '../form-builder/field-types';

const canvasConfig = {
	layout: {
		type: 'flow',
		flowAxis: 'row',
		placementStrategy: 'append',
		columns: 1
	}
} as const;

/**
 * Runs the page's canvas snapshot whenever the target re-renders — the React
 * stand-in for Svelte's `$effect` on `canvasTarget`. Mounted through the
 * target's `header` slot (it renders nothing) because that is the one place
 * that re-renders with the target's own reactive state.
 */
function CanvasSync({ target, onSync }: { target: FlexiTargetController; onSync: (target: FlexiTargetController) => void }) {
	useEffect(() => {
		onSync(target);
	});

	return null;
}

export default function FormBuilderExample() {
	const board = useRef<FlexiBoardController | undefined>(undefined);
	const canvasTarget = useRef<FlexiTargetController | undefined>(undefined);

	// `target.widgets` is a set whose identity never changes, so it can't be read
	// reactively through the adapter. The example snapshots it instead: this array
	// is what the count, the inspector and the JSON all read.
	const [fields, setFields] = useState<FieldEntry[]>([]);
	const [selectedUid, setSelectedUid] = useState<string | undefined>(undefined);
	// Mirrors of the two state values, so the registry's class function and
	// `componentProps` — both built once and handed to core — read them live.
	const fieldsRef = useRef<FieldEntry[]>(fields);
	const selectedUidRef = useRef<string | undefined>(selectedUid);
	fieldsRef.current = fields;
	selectedUidRef.current = selectedUid;

	// The target renders nothing until it is mounted and prepared, so the canvas
	// is legitimately empty on the first render. `ready` keeps the count and the
	// empty-state overlay from claiming otherwise before the first sync.
	const [ready, setReady] = useState(false);

	const mainEl = useRef<HTMLElement | null>(null);
	const asideEl = useRef<HTMLElement | null>(null);

	// The callbacks the board config closes over are rebuilt every render; these
	// refs keep the once-built config pointing at the current ones.
	const selectFieldRef = useRef<(widget: FlexiWidgetController) => void>(() => {});
	const syncFieldsRef = useRef<(autoSelect?: boolean) => void>(() => {});
	const selectedField = fields.find((field) => field.uid === selectedUid);

	const duplicateNames = useMemo(() => {
		const seen = new Set<string>();
		const duplicates = new Set<string>();

		for (const field of fields) {
			if (seen.has(field.meta.name)) {
				duplicates.add(field.meta.name);
			}
			seen.add(field.meta.name);
		}

		return duplicates;
	}, [fields]);

	// Below lg the panes are stacked, so a selection off-screen would be silent.
	// Scrolls this example's own `main` — never scrollIntoView(), which would
	// propagate out of the embed iframe.
	const scrollInspectorIntoView = useCallback(() => {
		const main = mainEl.current;
		const aside = asideEl.current;
		if (!main || !aside || main.scrollHeight <= main.clientHeight) {
			return;
		}

		main.scrollTo({ top: Math.max(0, aside.offsetTop - 12), behavior: 'smooth' });
	}, []);

	const selectField = useCallback(
		(widget: FlexiWidgetController) => {
			const meta = widget.metadata as FieldMeta | undefined;
			if (!meta) {
				return;
			}

			selectedUidRef.current = meta.uid;
			setSelectedUid(meta.uid);
			scrollInspectorIntoView();
		},
		[scrollInspectorIntoView]
	);

	/**
	 * Snapshots the canvas into `fields`, ordered by the flow grid's row order.
	 * Unlike the Svelte version this runs on every target render, so it returns
	 * the previous array unchanged when nothing moved — otherwise the state write
	 * would re-render the board, which would sync again.
	 */
	const syncFields = useCallback(
		(autoSelect = true) => {
			const target = canvasTarget.current;
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

			const previous = fieldsRef.current;
			const unchanged =
				previous.length === next.length &&
				next.every((field, i) => previous[i].uid === field.uid && previous[i].meta === field.meta);

			if (!unchanged) {
				fieldsRef.current = next;
				setFields(next);
			}

			setReady(true);

			// A user adds exactly one field at a time; several appearing at once is
			// the seeded layout (or an import) arriving, which selects nothing.
			const appeared = next.filter((field) => !previous.some((entry) => entry.uid === field.uid));
			const added = autoSelect && appeared.length === 1 ? appeared[0] : undefined;

			if (added) {
				selectField(added.widget as FlexiWidgetController);
			} else if (selectedUidRef.current && !next.some((field) => field.uid === selectedUidRef.current)) {
				selectedUidRef.current = undefined;
				setSelectedUid(undefined);
			}
		},
		[selectField]
	);

	// The board only ever sees this one config object: `registry` closes over the
	// refs above, so nothing here has to change when the selection does.
	const [{ registry, boardConfig }] = useState(() => {
		// Blue is selection (persistent, board furniture); fx-accent stays reserved
		// for provisional things — the widget in hand and the drop preview.
		function fieldClass(widget: FlexiWidgetController) {
			const meta = widget.metadata as FieldMeta | undefined;

			return cn(
				'relative flex w-full min-w-0 flex-col rounded-[14px] border border-rule-soft bg-panel px-3.5 py-3 shadow-card transition-colors duration-[120ms]',
				meta && meta.uid === selectedUidRef.current && 'bg-tint ring-2 ring-inset ring-blue',
				widget.isGrabbed && ' opacity-95 shadow-lift',
				widget.isShadow && 'border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent shadow-none',
				widget.dropRejected && 'border-rule-soft opacity-30 saturate-0'
			);
		}

		// One registry entry per field kind, all generated from the same table the
		// palette and the inspector read.
		const registry: Record<string, FlexiRegistryEntry> = Object.fromEntries(
			FIELD_KINDS.map((spec) => [
				spec.kind,
				{
					component: FormFieldWidget,
					// Built once: the card reads the live selection through these closures.
					componentProps: {
						onSelect: (widget: FlexiWidgetController) => selectFieldRef.current(widget),
						isSelected: (uid: string) => uid === selectedUidRef.current
					},
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
			onLayoutChange: () => syncFieldsRef.current()
		};

		return { registry, boardConfig };
	});

	selectFieldRef.current = selectField;
	syncFieldsRef.current = syncFields;

	/**
	 * `FlexiAdd` builds its widget directly — it neither forwards `type` nor reads
	 * the registry — so the entry is spread in by hand from the same table.
	 */
	const addWidget = useCallback(
		(spec: FieldKindSpec): AdderWidgetConfiguration => {
			const meta = spec.defaults();
			meta.name = uniqueName(meta.name, new Set(fieldsRef.current.map((field) => field.meta.name)));

			return {
				widget: { ...registry[spec.kind], type: spec.kind, metadata: meta },
				widthPx: 320,
				heightPx: 72
			};
		},
		[registry]
	);

	// Metadata is replaced, never mutated in place. The write triggers core,
	// which re-renders the card.
	function updateField(patch: Partial<FieldMeta>) {
		const entry = selectedField;
		if (!entry) {
			return;
		}

		entry.widget.metadata = { ...entry.meta, ...patch };
		syncFields(false);
	}

	function resetForm() {
		selectedUidRef.current = undefined;
		setSelectedUid(undefined);
		board.current?.importLayout({ canvas: defaultFields() });
		syncFields(false);
	}

	const onSync = useCallback(() => syncFields(true), [syncFields]);

	return (
		<main
			ref={mainEl}
			className="bg-paper relative flex h-full min-h-0 w-full flex-col gap-4 px-4 py-4 max-lg:overflow-y-auto lg:gap-6 lg:overflow-hidden lg:px-8 lg:py-6"
		>
			<header className="flex shrink-0 items-baseline justify-between gap-4">
				<div className="flex items-baseline gap-3">
					<h1 className="text-ink font-serif text-2xl lg:text-[30px]">Form builder</h1>
					<span className="text-faint hidden text-[11.5px] font-semibold sm:inline">
						1 col · flow · metadata
					</span>
				</div>
				<Button variant="outline" size="sm" className="rounded-full" onClick={resetForm} title="Reset the form">
					<RotateCcw className="size-3.5" />
					<span className="max-sm:sr-only">Reset</span>
				</Button>
			</header>

			{/* Below lg nothing is height-constrained: the panes stack at their natural
			    height and `main` is the only scroller. */}
			<div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-6">
				<FlexiBoard
					config={boardConfig}
					onfirstcreate={(controller) => (board.current = controller)}
					className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-5"
				>
					<FieldPalette onAdd={addWidget} />

					{/* The canvas is the page's one lifted card: it is the figure. */}
					<section className="border-rule-soft bg-panel shadow-card flex flex-col overflow-hidden rounded-[14px] border lg:min-h-0 lg:flex-1">
						<header className="border-rule-faint flex shrink-0 items-baseline justify-between gap-3 border-b px-4 py-3">
							<h2 className="text-ink font-serif text-[15px]">Contact form</h2>
							<span className="text-faint text-[11.5px] font-semibold">
								{ready && `${fields.length} ${fields.length === 1 ? 'field' : 'fields'}`}
							</span>
						</header>

						{/*
							overflow-x-clip, as in the dashboard example: a widget interpolating to
							its new row is absolutely positioned and briefly widens the grid, which
							would otherwise flash a horizontal scrollbar.
						*/}
						<div className="relative overflow-x-clip max-lg:min-h-[360px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
							<FlexiTarget
								keyName="canvas"
								onfirstcreate={(controller) => (canvasTarget.current = controller)}
								containerClassName="min-h-[360px] lg:min-h-full"
								className="min-h-[360px] content-start gap-3 p-4 lg:min-h-full"
								config={canvasConfig}
								header={({ target }) => <CanvasSync target={target} onSync={onSync} />}
							/>

							{ready && fields.length === 0 && (
								<div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
									<p className="text-faint text-[11.5px] font-semibold">Drag a field in to begin</p>
								</div>
							)}
						</div>
					</section>
				</FlexiBoard>

				<aside
					ref={asideEl}
					className="flex flex-col gap-4 sm:flex-row sm:gap-5 lg:min-h-0 lg:w-80 lg:shrink-0 lg:flex-col lg:gap-4 xl:w-96"
				>
					<FieldInspector
						key={selectedField?.uid ?? 'none'}
						field={selectedField}
						duplicateNames={duplicateNames}
						onchange={updateField}
					/>
					<SchemaPanel fields={fields} selectedUid={selectedUid} />
				</aside>
			</div>
		</main>
	);
}
