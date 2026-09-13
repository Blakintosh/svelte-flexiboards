import { FlexiAdd, FlexiDelete } from '@flexiboards/react';
import type { AdderWidgetConfiguration, FlexiDeleteController } from '@flexiboards/react';
import {
	AlignLeft,
	AtSign,
	ChevronDown,
	GripVertical,
	Heading,
	SquareCheck,
	Trash2,
	Type
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '$lib/utils.js';
import { FIELD_KINDS, type FieldKind, type FieldKindSpec } from './field-types';

export type FieldPaletteProps = {
	/** Builds the widget that `FlexiAdd` drags into the board. */
	onAdd: (spec: FieldKindSpec) => AdderWidgetConfiguration;
};

// Icons live here, not in field-types.ts, so the data model stays portable.
const ICONS: Record<FieldKind, ComponentType<{ className?: string }>> = {
	text: Type,
	email: AtSign,
	textarea: AlignLeft,
	select: ChevronDown,
	checkbox: SquareCheck,
	section: Heading
};

const addClass =
	'ui text-xs border-rule-soft bg-tint-2 text-body hover:bg-panel hover:text-ink hover:shadow-card focus-visible:outline-blue flex flex-1 basis-[calc(50%-0.25rem)] items-center gap-2 rounded-[10px] border px-2.5 py-2.5 text-left transition-all duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 sm:basis-[calc(33.333%-0.4rem)] lg:basis-auto';

// The warning arrives before the release, which is the only confirmation this
// action gets. `deleter.isHovered` rather than CSS :hover, so the keyboard
// pointer lights it up too.
const deleteClass = (deleter: FlexiDeleteController) =>
	cn(
		'ui text-xs border-rule-soft bg-tint-2 text-faint flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed px-3 py-3 text-center transition-colors duration-[120ms] lg:mt-auto lg:flex-col lg:py-6',
		deleter.isHovered && 'border-fx-accent/70 bg-tint-accent text-fx-accent'
	);

export default function FieldPalette({ onAdd }: FieldPaletteProps) {
	return (
		<div className="flex shrink-0 flex-col gap-2 lg:w-52">
			<span className="text-faint text-[11.5px] font-semibold">Fields</span>

			{/*
				Wrapped, not scrolled: FlexiAdd sets touch-action:none on its button, so a
				horizontal scroll strip would swallow touch drags instead of starting them.
			*/}
			<div className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
				{FIELD_KINDS.map((spec) => {
					const Icon = ICONS[spec.kind];

					return (
						<FlexiAdd key={spec.kind} addWidget={() => onAdd(spec)} className={addClass}>
							<GripVertical className="text-faint size-3 shrink-0" />
							<Icon className="text-blue size-3.5 shrink-0" />
							<span className="min-w-0 truncate">{spec.title}</span>
						</FlexiAdd>
					);
				})}
			</div>

			<FlexiDelete className={deleteClass}>
				<Trash2 className="size-4 shrink-0 lg:size-6" />
				Drop to remove
			</FlexiDelete>
		</div>
	);
}
