import { ChevronDown } from 'lucide-react';
import type { FieldMeta } from './field-types';

export type FieldPreviewProps = {
	meta: FieldMeta;
};

// Inert, but rendered rather than faked: disabled native controls at full
// opacity so the canvas reads as a form, not as a broken one.
const control =
	'h-8 w-full rounded-[9px] border border-rule-soft bg-paper px-3 text-[13px] text-body placeholder:text-faint shadow-none outline-none disabled:cursor-default disabled:opacity-100';

export default function FieldPreview({ meta }: FieldPreviewProps) {
	if (meta.kind === 'text' || meta.kind === 'email') {
		return (
			<input
				type={meta.kind === 'email' ? 'email' : 'text'}
				disabled
				placeholder={meta.placeholder}
				className={control}
			/>
		);
	}

	if (meta.kind === 'textarea') {
		return (
			<textarea
				disabled
				rows={2}
				placeholder={meta.placeholder}
				className="border-rule-soft bg-paper text-body placeholder:text-faint min-h-14 w-full resize-none rounded-[9px] border px-3 py-2 text-[13px] shadow-none outline-none disabled:cursor-default disabled:opacity-100"
			/>
		);
	}

	if (meta.kind === 'select') {
		// Native <select>, chevron drawn alongside it so the disabled control keeps
		// the same affordance the live one would have.
		return (
			<div className="relative w-full">
				<select disabled className={`${control} text-faint cursor-default appearance-none pr-8`}>
					<option>{meta.placeholder || 'Select an option'}</option>
				</select>
				<ChevronDown className="text-faint pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2" />
			</div>
		);
	}

	if (meta.kind === 'checkbox') {
		return (
			<div className="flex items-center gap-2">
				<input
					type="checkbox"
					disabled
					className="accent-ink border-rule-soft size-4 shrink-0 rounded-[4px] border disabled:cursor-default disabled:opacity-100"
				/>
				<span className="text-body truncate text-[13px]">{meta.label}</span>
			</div>
		);
	}

	if (meta.kind === 'section') {
		return <hr className="border-rule-soft border-t" />;
	}

	return null;
}
