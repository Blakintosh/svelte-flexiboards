import { useFlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import { cn } from '$lib/utils.js';
import Grabber from '../common/grabber';
import FieldPreview from './field-preview';
import { FIELD_KIND, type FieldMeta } from './field-types';

export type FormFieldWidgetProps = {
	/** Passed in by the board registry's `componentProps`. */
	onSelect: (widget: FlexiWidgetController) => void;
	/** Reads the page's selection state — a getter, since `componentProps` is built once. */
	isSelected: (uid: string) => boolean;
};

export default function FormFieldWidget({ onSelect, isSelected }: FormFieldWidgetProps) {
	// The widget controller *is* the field: everything rendered below is read
	// straight off its metadata, so an inspector write re-renders this card.
	const widget = useFlexiWidget();

	const meta = widget.metadata as FieldMeta | undefined;
	const spec = meta ? FIELD_KIND[meta.kind] : undefined;
	const selected = !!meta && isSelected(meta.uid);

	if (!meta || !spec) {
		return null;
	}

	return (
		<>
			<div className="flex w-full min-w-0 items-start gap-2">
				{/* The only drag affordance. Its own z-layer, so it wins over the select button. */}
				<Grabber size={14} className="relative z-10 -ml-1 shrink-0" />

				<div className="min-w-0 flex-1">
					<div className="flex items-baseline justify-between gap-2">
						{meta.kind === 'section' ? (
							<h3 className="text-ink min-w-0 truncate font-serif text-[15px]">{meta.label}</h3>
						) : (
							<span className="text-ink min-w-0 truncate text-[11.5px] font-semibold">
								{meta.label}
								{meta.required && <span className="text-fx-accent"> *</span>}
							</span>
						)}
						{/* The metadata story, told on the card instead of only in the JSON. */}
						<span
							className={cn(
								'hidden shrink-0 font-mono text-[10px] sm:inline',
								selected ? 'text-blue' : 'text-faint'
							)}
						>
							{meta.kind} · {meta.name}
						</span>
					</div>

					{/* Rendered, never operable: the canvas is a design surface, not a form. */}
					<div className="pointer-events-none mt-2" aria-hidden="true">
						<FieldPreview meta={meta} />
					</div>
				</div>
			</div>

			{/*
				One full-bleed tab stop for selection, sitting under the grip. Clicking
				anywhere on the card (including "on" an inert input) selects the field.
			*/}
			<button
				type="button"
				className="focus-visible:outline-blue absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2"
				aria-label={`Edit field: ${meta.label}`}
				onClick={() => onSelect(widget)}
			/>
		</>
	);
}
