import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { FIELD_KIND, slugify, type FieldEntry, type FieldMeta } from './field-types';

export type FieldInspectorProps = {
	field: FieldEntry | undefined;
	/** Keys used by more than one field — warned about, never blocked. */
	duplicateNames: Set<string>;
	onchange: (patch: Partial<FieldMeta>) => void;
};

// Native controls on the site tokens — the example depends on Tailwind and
// the tokens only, no component library.
const inputClass =
	'h-8 w-full rounded-[9px] border border-rule-soft bg-paper px-3 text-[13px] text-ink placeholder:text-faint shadow-none outline-none transition-[border-color] duration-[120ms] focus-visible:border-blue';

const labelClass = 'text-faint text-[11.5px] font-semibold';

// A checkbox painted as a toggle: real input, real semantics, Tailwind-only
// track and thumb.
const switchClass =
	'relative h-[18px] w-8 shrink-0 cursor-pointer appearance-none rounded-full bg-rule outline-none transition-colors duration-[130ms] before:absolute before:top-[2px] before:left-[2px] before:size-[14px] before:rounded-full before:bg-paper before:shadow-sm before:transition-transform before:duration-[130ms] before:content-[""] checked:bg-blue checked:before:translate-x-[14px] focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * Mounted under a `key` of the selected field's uid, so the two local drafts —
 * the key (sanitised on commit) and the options list (line-based) — are seeded
 * per selection rather than rewritten mid-keystroke.
 */
export default function FieldInspector({ field, duplicateNames, onchange }: FieldInspectorProps) {
	const [nameDraft, setNameDraft] = useState(field?.meta.name ?? '');
	const [optionsDraft, setOptionsDraft] = useState((field?.meta.options ?? []).join('\n'));

	const spec = field ? FIELD_KIND[field.meta.kind] : undefined;
	const controls = new Set(spec?.inspector ?? []);
	const isDuplicate = !!field && duplicateNames.has(field.meta.name);

	function commitName() {
		const next = slugify(nameDraft);
		setNameDraft(next);
		if (field && next !== field.meta.name) {
			onchange({ name: next });
		}
	}

	function commitOptions(value: string) {
		setOptionsDraft(value);
		onchange({
			options: value
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line.length > 0)
		});
	}

	const uid = field?.uid;

	return (
		<section className="flex min-w-0 flex-col gap-2 sm:flex-1 lg:flex-none">
			<span className="text-faint text-[11.5px] font-semibold">Field</span>

			<div className="border-rule-soft bg-panel shadow-card rounded-[14px] border p-4">
				{!field || !spec ? (
					<div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
						<SlidersHorizontal className="text-faint size-5" />
						<p className="text-faint text-[11.5px] font-semibold">Select a field to edit it</p>
					</div>
				) : (
					<div className="flex flex-col gap-3">
						<span className="bg-tint text-ink w-fit rounded-full px-2 py-0.5 text-[11.5px] font-semibold">
							{spec.title}
						</span>

						{controls.has('label') && (
							<div className="flex flex-col gap-1">
								<label htmlFor={`${uid}-label`} className={labelClass}>
									Label
								</label>
								<input
									id={`${uid}-label`}
									value={field.meta.label}
									className={inputClass}
									onChange={(event) => onchange({ label: event.currentTarget.value })}
								/>
							</div>
						)}

						{controls.has('name') && (
							<div className="flex flex-col gap-1">
								<label htmlFor={`${uid}-name`} className={labelClass}>
									Key
								</label>
								<input
									id={`${uid}-name`}
									value={nameDraft}
									className={`${inputClass} font-mono`}
									onChange={(event) => setNameDraft(event.currentTarget.value)}
									onBlur={commitName}
									onKeyDown={(event) => {
										if (event.key === 'Enter') {
											event.preventDefault();
											commitName();
										}
									}}
								/>
								{isDuplicate ? (
									<p className="text-fx-accent text-[11.5px] font-semibold">Key already used</p>
								) : (
									<p className="text-faint text-[11.5px] font-semibold">lowercase · no spaces</p>
								)}
							</div>
						)}

						{controls.has('placeholder') && (
							<div className="flex flex-col gap-1">
								<label htmlFor={`${uid}-placeholder`} className={labelClass}>
									Placeholder
								</label>
								<input
									id={`${uid}-placeholder`}
									value={field.meta.placeholder ?? ''}
									className={inputClass}
									onChange={(event) => onchange({ placeholder: event.currentTarget.value })}
								/>
							</div>
						)}

						{controls.has('options') && (
							<div className="flex flex-col gap-1">
								<label htmlFor={`${uid}-options`} className={labelClass}>
									Options
								</label>
								<textarea
									id={`${uid}-options`}
									value={optionsDraft}
									rows={3}
									className="border-rule-soft bg-paper text-ink focus-visible:border-blue min-h-16 w-full resize-none rounded-[9px] border px-3 py-2 text-[13px] shadow-none outline-none"
									onChange={(event) => commitOptions(event.currentTarget.value)}
								/>
								<p className="text-faint text-[11.5px] font-semibold">one per line</p>
							</div>
						)}

						{controls.has('required') && (
							<div className="border-rule-faint flex items-center justify-between gap-3 border-t pt-3">
								<label htmlFor={`${uid}-required`} className={labelClass}>
									Required
								</label>
								<input
									id={`${uid}-required`}
									type="checkbox"
									role="switch"
									aria-checked={field.meta.required ?? false}
									checked={field.meta.required ?? false}
									className={switchClass}
									onChange={(event) => onchange({ required: event.currentTarget.checked })}
								/>
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
