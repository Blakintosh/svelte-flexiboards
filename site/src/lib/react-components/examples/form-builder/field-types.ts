/**
 * The form builder's data model.
 *
 * Everything the example knows about a field lives in the widget's `metadata`.
 * The board only ever decides the *order* of those objects — this file is the
 * single source of truth for what they contain, shared by the palette, the
 * registry, the adder, the inspector and the schema listing.
 *
 * Deliberately free of markup and of any Flexiboards adapter import, so the
 * React port can use it unchanged.
 */

export type FieldKind = 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'section';

export type InspectorControl = 'label' | 'name' | 'placeholder' | 'required' | 'options';

export type FieldMeta = {
	uid: string;
	kind: FieldKind;
	name: string;
	label: string;
	placeholder?: string;
	required?: boolean;
	options?: string[];
};

export type FieldKindSpec = {
	kind: FieldKind;
	/** Human name, shown on the palette chip and the inspector's kind badge. */
	title: string;
	/** Which inspector rows this kind has. Absent rows are omitted, never disabled. */
	inspector: InspectorControl[];
	/** A fresh metadata object. Never share one between two widgets. */
	defaults: () => FieldMeta;
};

/**
 * The minimum a widget controller has to look like for this example to drive it.
 * Structurally satisfied by both `FlexiWidgetController` adapters.
 */
export type FieldWidgetHandle = { metadata: Record<string, unknown> | undefined };

export type FieldEntry = {
	uid: string;
	widget: FieldWidgetHandle;
	meta: FieldMeta;
};

/** A `FlexiWidgetLayoutEntry`, narrowed to this example's kinds and metadata. */
export type FieldLayoutEntry = {
	type: FieldKind;
	x: number;
	y: number;
	width: number;
	height: number;
	metadata: FieldMeta;
};

let uidCounter = 0;

/**
 * `FlexiWidgetController` exposes no public id, so selection is keyed on a uid
 * the example mints itself and carries in metadata.
 */
export function nextUid(): string {
	uidCounter += 1;
	return `fld_${uidCounter}`;
}

export const FIELD_KINDS: FieldKindSpec[] = [
	{
		kind: 'text',
		title: 'Short text',
		inspector: ['label', 'name', 'placeholder', 'required'],
		defaults: () => ({
			uid: nextUid(),
			kind: 'text',
			name: 'short_text',
			label: 'Short text',
			placeholder: 'Type here',
			required: false
		})
	},
	{
		kind: 'email',
		title: 'Email',
		inspector: ['label', 'name', 'placeholder', 'required'],
		defaults: () => ({
			uid: nextUid(),
			kind: 'email',
			name: 'email',
			label: 'Email address',
			placeholder: 'you@example.com',
			required: false
		})
	},
	{
		kind: 'textarea',
		title: 'Long text',
		inspector: ['label', 'name', 'placeholder', 'required'],
		defaults: () => ({
			uid: nextUid(),
			kind: 'textarea',
			name: 'message',
			label: 'Message',
			placeholder: 'Tell us more',
			required: false
		})
	},
	{
		kind: 'select',
		title: 'Dropdown',
		inspector: ['label', 'name', 'placeholder', 'required', 'options'],
		defaults: () => ({
			uid: nextUid(),
			kind: 'select',
			name: 'choice',
			label: 'Choose one',
			placeholder: 'Select an option',
			required: false,
			options: ['First option', 'Second option']
		})
	},
	{
		kind: 'checkbox',
		title: 'Checkbox',
		inspector: ['label', 'name', 'required'],
		defaults: () => ({
			uid: nextUid(),
			kind: 'checkbox',
			name: 'agree',
			label: 'I agree to the terms',
			required: false
		})
	},
	{
		kind: 'section',
		title: 'Section',
		inspector: ['label'],
		defaults: () => ({
			uid: nextUid(),
			kind: 'section',
			name: 'section',
			label: 'Section heading'
		})
	}
];

export const FIELD_KIND: Record<FieldKind, FieldKindSpec> = FIELD_KINDS.reduce(
	(map, spec) => {
		map[spec.kind] = spec;
		return map;
	},
	{} as Record<FieldKind, FieldKindSpec>
);

export function cloneMeta(meta: FieldMeta): FieldMeta {
	return meta.options ? { ...meta, options: [...meta.options] } : { ...meta };
}

const SEED_FIELDS: FieldLayoutEntry[] = [
	{
		type: 'text',
		x: 0,
		y: 0,
		width: 1,
		height: 1,
		metadata: {
			uid: 'seed_name',
			kind: 'text',
			name: 'full_name',
			label: 'Full name',
			placeholder: 'Jane Doe',
			required: true
		}
	},
	{
		type: 'email',
		x: 0,
		y: 1,
		width: 1,
		height: 1,
		metadata: {
			uid: 'seed_email',
			kind: 'email',
			name: 'email',
			label: 'Email address',
			placeholder: 'you@example.com',
			required: true
		}
	},
	{
		type: 'select',
		x: 0,
		y: 2,
		width: 1,
		height: 1,
		metadata: {
			uid: 'seed_source',
			kind: 'select',
			name: 'referral_source',
			label: 'How did you hear about us?',
			placeholder: 'Pick one',
			required: false,
			options: ['A colleague', 'Search', 'Conference talk']
		}
	},
	{
		type: 'checkbox',
		x: 0,
		y: 3,
		width: 1,
		height: 1,
		metadata: {
			uid: 'seed_updates',
			kind: 'checkbox',
			name: 'subscribe',
			label: 'Send me product updates',
			required: false
		}
	}
];

/** A fresh copy of the seed layout — core adopts metadata objects by reference. */
export function defaultFields(): FieldLayoutEntry[] {
	return SEED_FIELDS.map((entry) => ({ ...entry, metadata: cloneMeta(entry.metadata) }));
}

/** Keys are lowercase, underscore-separated, and never empty. */
export function slugify(value: string): string {
	const slug = value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '');

	return slug || 'field';
}

/** `email` → `email_2` → `email_3`, so a fresh field never silently collides. */
export function uniqueName(base: string, taken: Set<string>): string {
	if (!taken.has(base)) {
		return base;
	}

	let suffix = 2;
	while (taken.has(`${base}_${suffix}`)) {
		suffix += 1;
	}

	return `${base}_${suffix}`;
}

/** The public shape: metadata minus the uid the example uses for selection. */
export function toSchemaEntry(meta: FieldMeta): Record<string, unknown> {
	const entry: Record<string, unknown> = {
		name: meta.name,
		type: meta.kind,
		label: meta.label
	};

	if (meta.kind !== 'section' && meta.kind !== 'checkbox' && meta.placeholder) {
		entry.placeholder = meta.placeholder;
	}
	if (meta.required) {
		entry.required = true;
	}
	if (meta.kind === 'select' && meta.options?.length) {
		entry.options = meta.options;
	}

	return entry;
}
