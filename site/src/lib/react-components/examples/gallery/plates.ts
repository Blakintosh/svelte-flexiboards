/**
 * Gallery — plate catalogue, artwork recipes and layout maths.
 *
 * Framework-free on purpose: everything here is plain TypeScript over the
 * library's layout types, so a React port imports the same file and only swaps
 * the package the `ResponsiveFlexiLayout` type comes from.
 */
import type { CSSProperties } from 'react';
import type { FlexiWidgetLayoutEntry, ResponsiveFlexiLayout } from '@flexiboards/react';

export type Motif = 'arc' | 'horizon' | 'strata' | 'moire' | 'bloom' | 'grain';
export type PlateType = 'plate' | 'panorama';
export type Breakpoint = 'lg' | 'sm' | 'default';

export type Plate = {
	/** Catalogue number, printed in the plate's caption. */
	id: string;
	/** Descriptive title — read out to assistive tech, not printed. */
	title: string;
	motif: Motif;
	/** Index into {@link INKS}. */
	pair: number;
	/** Registry key: `panorama` plates carry the wide-only size bounds. */
	type: PlateType;
};

/**
 * The cyanotype ramp. These are fixed hexes rather than theme tokens on
 * purpose — a print keeps its ink whichever way the room is lit — but two of
 * the five are grounded on deep blue so the mosaic reads in both site themes.
 */
const INKS = [
	{
		ground: '#eaf0f6',
		ink: '#10202e',
		tone: '#3d6690',
		veil: 'rgba(16, 32, 46, 0.22)',
		screen: 'rgba(16, 32, 46, 0.09)'
	},
	{
		ground: '#f4f7fa',
		ink: '#1b3a5c',
		tone: '#6b93bb',
		veil: 'rgba(27, 58, 92, 0.2)',
		screen: 'rgba(27, 58, 92, 0.08)'
	},
	{
		ground: '#1b3a5c',
		ink: '#a3c0d8',
		tone: '#6b93bb',
		veil: 'rgba(163, 192, 216, 0.24)',
		screen: 'rgba(163, 192, 216, 0.11)'
	},
	{
		ground: '#10202e',
		ink: '#6b93bb',
		tone: '#3d6690',
		veil: 'rgba(107, 147, 187, 0.26)',
		screen: 'rgba(107, 147, 187, 0.13)'
	},
	{
		ground: '#eaf0f6',
		ink: '#3d6690',
		tone: '#a3c0d8',
		veil: 'rgba(61, 102, 144, 0.24)',
		screen: 'rgba(16, 32, 46, 0.07)'
	}
] as const;

type Ink = (typeof INKS)[number];

/** A motif is a stack of background layers plus their sizes, topmost first. */
function motifLayers(motif: Motif, c: Ink): { layers: string[]; sizes: string[] } {
	switch (motif) {
		case 'arc':
			return {
				layers: [
					`repeating-radial-gradient(circle at 12% 88%, ${c.ink} 0 2px, transparent 2px 17px)`,
					`radial-gradient(circle at 12% 88%, ${c.tone} 0 26%, transparent 64%)`
				],
				sizes: ['auto', 'auto']
			};
		case 'horizon':
			return {
				layers: [
					`linear-gradient(to bottom, transparent 0 57.4%, ${c.ink} 57.4% 58.1%, transparent 58.1%)`,
					`radial-gradient(circle at 72% 34%, ${c.ink} 0 11%, transparent 11.4%)`,
					`repeating-linear-gradient(to bottom, ${c.veil} 0 1px, transparent 1px 8px)`,
					`linear-gradient(to bottom, transparent 0 58%, ${c.tone} 58% 100%)`
				],
				sizes: ['auto', 'auto', 'auto', 'auto']
			};
		case 'strata':
			return {
				layers: [
					`repeating-linear-gradient(173deg, ${c.ink} 0 4px, transparent 4px 13px, ${c.tone} 13px 20px, transparent 20px 33px)`
				],
				sizes: ['auto']
			};
		case 'moire':
			return {
				layers: [
					`repeating-linear-gradient(47deg, ${c.ink} 0 1px, transparent 1px 11px)`,
					`repeating-linear-gradient(-43deg, ${c.tone} 0 1.5px, transparent 1.5px 10px)`
				],
				sizes: ['auto', 'auto']
			};
		case 'bloom':
			return {
				layers: [
					`radial-gradient(circle at 31% 30%, ${c.ink} 0 5%, transparent 45%)`,
					`radial-gradient(circle at 70% 68%, ${c.tone} 0 9%, transparent 54%)`,
					`radial-gradient(circle at 84% 18%, ${c.veil} 0 3%, transparent 36%)`
				],
				sizes: ['auto', 'auto', 'auto']
			};
		case 'grain':
			return {
				layers: [
					`radial-gradient(${c.ink} 1.1px, transparent 1.2px)`,
					`linear-gradient(122deg, ${c.tone} 0%, transparent 72%)`
				],
				sizes: ['11px 11px', 'auto']
			};
	}
}

/**
 * The full inline style for one plate's artwork: a ground colour, a fine print
 * screen, and the motif's own gradient layers. No images, no assets.
 *
 * React takes a style object rather than the Svelte twin's `style` string.
 */
export function plateStyle(motif: Motif, pair: number): CSSProperties {
	const c = INKS[pair % INKS.length];
	const { layers, sizes } = motifLayers(motif, c);

	// The screen sits on top of everything, like the halftone of a real print.
	const allLayers = [
		`repeating-linear-gradient(90deg, ${c.screen} 0 1px, transparent 1px 4px)`,
		...layers
	];
	const allSizes = ['auto', ...sizes];

	return {
		backgroundColor: c.ground,
		backgroundImage: allLayers.join(', '),
		backgroundSize: allSizes.join(', '),
		backgroundPosition: '0 0',
		backgroundRepeat: 'repeat'
	};
}

export const PLATES: Plate[] = [
	{ id: 'PL-01', title: 'Arc study, harbour wall', motif: 'arc', pair: 0, type: 'plate' },
	{ id: 'PL-02', title: 'Long horizon, low sun', motif: 'horizon', pair: 2, type: 'panorama' },
	{ id: 'PL-03', title: 'Cliff strata, north face', motif: 'strata', pair: 1, type: 'plate' },
	{ id: 'PL-04', title: 'Bloom, second exposure', motif: 'bloom', pair: 4, type: 'plate' },
	{ id: 'PL-05', title: 'Moiré, folded gauze', motif: 'moire', pair: 1, type: 'plate' },
	{ id: 'PL-06', title: 'Grain field, dusk', motif: 'grain', pair: 3, type: 'plate' },
	{ id: 'PL-07', title: 'Estuary panorama', motif: 'strata', pair: 3, type: 'panorama' },
	{ id: 'PL-08', title: 'Arc study, inverted', motif: 'arc', pair: 4, type: 'plate' },
	{ id: 'PL-09', title: 'Bloom, contact print', motif: 'bloom', pair: 2, type: 'plate' },
	{ id: 'PL-10', title: 'Moiré, tide fence', motif: 'moire', pair: 0, type: 'plate' }
];

export const BREAKPOINT_GRIDS: Record<
	Breakpoint,
	{ columns: number; minRows: number; maxRows: number; rowSizing: string }
> = {
	lg: { columns: 6, minRows: 3, maxRows: 6, rowSizing: 'minmax(0, 150px)' },
	sm: { columns: 4, minRows: 4, maxRows: 7, rowSizing: 'minmax(0, 140px)' },
	default: { columns: 2, minRows: 8, maxRows: 11, rowSizing: 'minmax(0, 132px)' }
};

/** Each plate's resting span per breakpoint: `[width, height]`. */
const SPANS: Record<Breakpoint, Record<string, [number, number]>> = {
	lg: {
		'PL-01': [2, 2],
		'PL-02': [3, 1],
		'PL-03': [1, 2],
		'PL-04': [1, 1],
		'PL-05': [1, 1],
		'PL-06': [1, 1],
		'PL-07': [3, 1],
		'PL-08': [1, 1],
		'PL-09': [1, 1],
		'PL-10': [1, 1]
	},
	sm: {
		'PL-01': [2, 2],
		'PL-02': [2, 1],
		'PL-03': [1, 2],
		'PL-04': [1, 1],
		'PL-05': [1, 1],
		'PL-06': [1, 1],
		'PL-07': [2, 1],
		'PL-08': [1, 1],
		'PL-09': [1, 1],
		'PL-10': [1, 1]
	},
	default: {
		'PL-01': [2, 2],
		'PL-02': [2, 1],
		'PL-03': [1, 2],
		'PL-04': [1, 1],
		'PL-05': [1, 1],
		'PL-06': [1, 1],
		'PL-07': [2, 1],
		'PL-08': [1, 1],
		'PL-09': [1, 1],
		'PL-10': [1, 1]
	}
};

const PLATES_BY_ID = new Map(PLATES.map((plate) => [plate.id, plate]));

/** The caption's second half, where a plate has something worth naming. */
function plateNote(plate: Plate): string | undefined {
	if (plate.type === 'panorama') return 'panorama';
	if (plate.motif === 'moire') return 'moiré';
	return undefined;
}

function entry(id: string, x: number, y: number, bp: Breakpoint, index: number) {
	const plate = PLATES_BY_ID.get(id)!;
	const [width, height] = SPANS[bp][id];

	return {
		id,
		type: plate.type,
		x,
		y,
		width,
		height,
		metadata: {
			plateId: plate.id,
			title: plate.title,
			// Short caption name where the plate has one — "PL-02 · panorama".
			note: plateNote(plate),
			motif: plate.motif,
			pair: plate.pair,
			// Drives the staggered enter animation after an import.
			index
		}
	} satisfies FlexiWidgetLayoutEntry;
}

/** `[id, x, y]` triples — the designed mosaic, per breakpoint. */
const DEFAULT_PLACEMENTS: Record<Breakpoint, [string, number, number][]> = {
	lg: [
		['PL-01', 0, 0],
		['PL-02', 2, 0],
		['PL-03', 5, 0],
		['PL-04', 2, 1],
		['PL-05', 3, 1],
		['PL-06', 4, 1],
		['PL-07', 0, 2],
		['PL-08', 3, 2],
		['PL-09', 4, 2],
		['PL-10', 5, 2]
	],
	sm: [
		['PL-01', 0, 0],
		['PL-02', 2, 0],
		['PL-03', 2, 1],
		['PL-04', 3, 1],
		['PL-07', 0, 2],
		['PL-05', 3, 2],
		['PL-06', 0, 3],
		['PL-08', 1, 3],
		['PL-09', 2, 3],
		['PL-10', 3, 3]
	],
	default: [
		['PL-01', 0, 0],
		['PL-02', 0, 2],
		['PL-03', 0, 3],
		['PL-04', 1, 3],
		['PL-05', 1, 4],
		['PL-07', 0, 5],
		['PL-06', 0, 6],
		['PL-08', 1, 6],
		['PL-09', 0, 7],
		['PL-10', 1, 7]
	]
};

function placementsToLayout(bp: Breakpoint): FlexiWidgetLayoutEntry[] {
	return DEFAULT_PLACEMENTS[bp].map(([id, x, y], index) => entry(id, x, y, bp, index));
}

export const TARGET_KEY = 'plates';

export const DEFAULT_LAYOUTS: ResponsiveFlexiLayout = {
	lg: { [TARGET_KEY]: placementsToLayout('lg') },
	sm: { [TARGET_KEY]: placementsToLayout('sm') },
	default: { [TARGET_KEY]: placementsToLayout('default') }
};

// -- shuffle ---------------------------------------------------------------

function isFree(cells: boolean[][], x: number, y: number, w: number, h: number): boolean {
	for (let row = y; row < y + h; row++) {
		for (let col = x; col < x + w; col++) {
			if (cells[row][col]) return false;
		}
	}
	return true;
}

function occupy(cells: boolean[][], x: number, y: number, w: number, h: number) {
	for (let row = y; row < y + h; row++) {
		for (let col = x; col < x + w; col++) {
			cells[row][col] = true;
		}
	}
}

/**
 * First-fit, row-major packing of a plate order into one breakpoint's grid,
 * capped at `rowCap` rows. Returns null if any plate cannot be placed — the
 * caller re-rolls rather than letting `importLayout` warn and drop a plate.
 */
function packLayout(
	bp: Breakpoint,
	order: Plate[],
	rowCap: number
): FlexiWidgetLayoutEntry[] | null {
	const grid = BREAKPOINT_GRIDS[bp];
	const rows = Math.min(rowCap, grid.maxRows);
	const cells: boolean[][] = Array.from({ length: rows }, () =>
		new Array<boolean>(grid.columns).fill(false)
	);
	const entries: FlexiWidgetLayoutEntry[] = [];

	for (let index = 0; index < order.length; index++) {
		const plate = order[index];
		const [spanW, spanH] = SPANS[bp][plate.id];
		const w = Math.min(spanW, grid.columns);
		const h = Math.min(spanH, rows);

		let placed = false;
		for (let y = 0; y + h <= rows && !placed; y++) {
			for (let x = 0; x + w <= grid.columns && !placed; x++) {
				if (!isFree(cells, x, y, w, h)) continue;
				occupy(cells, x, y, w, h);
				entries.push({ ...entry(plate.id, x, y, bp, index), width: w, height: h });
				placed = true;
			}
		}

		if (!placed) return null;
	}

	return entries;
}

function shuffled<T>(items: readonly T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

function samePlacement(
	a: FlexiWidgetLayoutEntry[] = [],
	b: FlexiWidgetLayoutEntry[] = []
): boolean {
	if (a.length !== b.length) return false;
	const key = (entries: FlexiWidgetLayoutEntry[]) =>
		[...entries]
			.map((e) => `${e.id}:${e.x},${e.y},${e.width},${e.height}`)
			.sort()
			.join('|');
	return key(a) === key(b);
}

function layoutsFor(order: Plate[], rowCap: (bp: Breakpoint) => number) {
	const lg = packLayout('lg', order, rowCap('lg'));
	const sm = packLayout('sm', order, rowCap('sm'));
	const base = packLayout('default', order, rowCap('default'));

	if (!lg || !sm || !base) return null;

	return {
		lg: { [TARGET_KEY]: lg },
		sm: { [TARGET_KEY]: sm },
		default: { [TARGET_KEY]: base }
	} satisfies ResponsiveFlexiLayout;
}

/**
 * Re-deals the mosaic for every breakpoint.
 *
 * The plate areas total exactly `columns × minRows` at every breakpoint, so a
 * shuffle is asked to tile the grid perfectly: random orders are tried first
 * (that is where the variety comes from), and a largest-first order — which
 * always tiles — is the fallback. Either way the mosaic still fits without
 * scrolling; growing the grid stays the user's move to make. An arrangement
 * identical to the one on screen is rejected, so Shuffle is never silent.
 */
export function buildShuffledLayouts(current?: ResponsiveFlexiLayout): ResponsiveFlexiLayout {
	const compact = (bp: Breakpoint) => BREAKPOINT_GRIDS[bp].minRows;

	for (let attempt = 0; attempt < 40; attempt++) {
		const layouts = layoutsFor(shuffled(PLATES), compact);
		if (!layouts) continue;
		if (current && samePlacement(current.lg?.[TARGET_KEY], layouts.lg[TARGET_KEY])) continue;
		return layouts;
	}

	// Largest-first, ties broken at random: tiles the grid every time.
	const byArea = shuffled(PLATES).sort((a, b) => {
		const area = (plate: Plate) => SPANS.lg[plate.id][0] * SPANS.lg[plate.id][1];
		return area(b) - area(a);
	});

	return layoutsFor(byArea, compact) ?? DEFAULT_LAYOUTS;
}
