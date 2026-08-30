import type { FlexiWidgetLayoutEntry, ResponsiveFlexiLayout } from '@flexiboards/svelte';

/**
 * The example's own view mode. `auto` lets the viewport decide (the site's
 * desktop / tablet / mobile buttons then swap the board's layout by themselves);
 * the other three pin a breakpoint so the swap is visible without resizing.
 */
export type Pin = 'auto' | 'lg' | 'md' | 'sm';

export const BREAKPOINT_KEYS = ['lg', 'md', 'sm'] as const;
export type BreakpointKey = (typeof BREAKPOINT_KEYS)[number];

export type BreakpointSpec = {
	columns: number;
	rows: number;
	/** Row height in px. Columns are `1fr`, so cells are square when there is room. */
	cell: number;
	/** Grid gap in px — mirrored by `gapClass` so Tailwind emits the utility. */
	gapPx: number;
	gapClass: string;
	/** Plate padding in px, mirrored by `padClass`. */
	padPx: number;
	padClass: string;
	/** Human-readable grid size for the plate's readout. */
	grid: string;
	/** The real viewport threshold, shown as the segment's tooltip. */
	threshold: string;
};

export const BREAKPOINTS: Record<BreakpointKey, BreakpointSpec> = {
	lg: {
		columns: 6,
		rows: 3,
		cell: 100,
		gapPx: 12,
		gapClass: 'gap-3',
		padPx: 12,
		padClass: 'p-3',
		grid: '6 × 3',
		threshold: '≥ 1024px'
	},
	md: {
		columns: 4,
		rows: 5,
		cell: 72,
		gapPx: 8,
		gapClass: 'gap-2',
		padPx: 12,
		padClass: 'p-3',
		grid: '4 × 5',
		threshold: '≥ 768px'
	},
	sm: {
		columns: 3,
		rows: 6,
		cell: 64,
		gapPx: 8,
		gapClass: 'gap-2',
		padPx: 10,
		padClass: 'p-2.5',
		grid: '3 × 6',
		threshold: '< 768px'
	}
};

/** The plate's intrinsic width: the grid at square cells, plus its own padding. */
export function plateWidth(spec: BreakpointSpec): number {
	return (
		spec.columns * spec.cell + (spec.columns - 1) * spec.gapPx + spec.padPx * 2 + /* 1px border */ 2
	);
}

export function isBreakpointKey(value: string): value is BreakpointKey {
	return (BREAKPOINT_KEYS as readonly string[]).includes(value);
}

/**
 * `ResponsiveFlexiBoard` derives its active breakpoint purely from `window.matchMedia`
 * — there is no API to force one. So the switcher remaps the thresholds themselves,
 * which is ordinary public config: the pinned key drops to a min-width every viewport
 * satisfies, the others go out of reach. Values are kept distinct so the controller's
 * descending sort never has to break a tie.
 */
const AUTO_BREAKPOINTS: Record<string, number> = { lg: 1024, md: 768, sm: 0 };
const OUT_OF_REACH = 100000;

export function breakpointsFor(pin: Pin): Record<string, number> {
	if (pin === 'auto') {
		return { ...AUTO_BREAKPOINTS };
	}

	let far = OUT_OF_REACH;
	const breakpoints: Record<string, number> = {};
	for (const key of BREAKPOINT_KEYS) {
		breakpoints[key] = key === pin ? 1 : far++;
	}
	return breakpoints;
}

/**
 * Every entry carries its own layout id in `metadata.tile`. The widget controller
 * doesn't expose the id it was imported with, so this is how the live-JSON bar
 * knows which line belongs to the tile currently in hand.
 */
const app = (id: string, x: number, y: number): FlexiWidgetLayoutEntry => ({
	id: `app-${id}`,
	type: 'app',
	x,
	y,
	width: 1,
	height: 1,
	metadata: { tile: `app-${id}`, app: id }
});

/**
 * One widget set, three arrangements. Nothing appears or disappears between
 * breakpoints — only where it sits. Each grid deliberately keeps four to six free
 * cells so the first drag a visitor tries has somewhere to land.
 */
export const DEFAULT_LAYOUTS: ResponsiveFlexiLayout = {
	// 6 × 3 — 14 of 18 cells used.
	lg: {
		apps: [
			{ id: 'clock', type: 'clock', x: 0, y: 0, width: 2, height: 1, metadata: { tile: 'clock' } },
			{
				id: 'weather',
				type: 'weather',
				x: 2,
				y: 0,
				width: 2,
				height: 1,
				metadata: { tile: 'weather' }
			},
			{
				id: 'now',
				type: 'now-playing',
				x: 4,
				y: 0,
				width: 2,
				height: 2,
				metadata: { tile: 'now' }
			},
			app('mail', 0, 1),
			app('messages', 1, 1),
			app('camera', 2, 1),
			app('calendar', 3, 1),
			app('maps', 0, 2),
			app('settings', 1, 2)
		]
	},
	// 4 × 5 — 14 of 20 cells used.
	md: {
		apps: [
			{ id: 'clock', type: 'clock', x: 0, y: 0, width: 2, height: 1, metadata: { tile: 'clock' } },
			{
				id: 'weather',
				type: 'weather',
				x: 2,
				y: 0,
				width: 2,
				height: 1,
				metadata: { tile: 'weather' }
			},
			{
				id: 'now',
				type: 'now-playing',
				x: 0,
				y: 1,
				width: 2,
				height: 2,
				metadata: { tile: 'now' }
			},
			app('mail', 2, 1),
			app('messages', 3, 1),
			app('camera', 2, 2),
			app('calendar', 3, 2),
			app('maps', 0, 3),
			app('settings', 1, 3)
		]
	},
	// 3 × 6 — 14 of 18 cells used.
	sm: {
		apps: [
			{ id: 'clock', type: 'clock', x: 0, y: 0, width: 2, height: 1, metadata: { tile: 'clock' } },
			app('settings', 2, 0),
			{
				id: 'now',
				type: 'now-playing',
				x: 0,
				y: 1,
				width: 2,
				height: 2,
				metadata: { tile: 'now' }
			},
			app('mail', 2, 1),
			app('messages', 2, 2),
			{
				id: 'weather',
				type: 'weather',
				x: 0,
				y: 3,
				width: 2,
				height: 1,
				metadata: { tile: 'weather' }
			},
			app('camera', 2, 3),
			app('calendar', 0, 4),
			app('maps', 1, 4)
		]
	}
};

function formatEntry(entry: FlexiWidgetLayoutEntry): string {
	const parts: string[] = [];
	if (entry.id !== undefined) {
		parts.push(`"id": ${JSON.stringify(entry.id)}`);
	}
	parts.push(`"type": ${JSON.stringify(entry.type)}`);
	parts.push(`"x": ${entry.x}`, `"y": ${entry.y}`);
	parts.push(`"width": ${entry.width}`, `"height": ${entry.height}`);
	// `tile` is plumbing for the live-JSON highlight, not part of the example's
	// data — keep it out of the listing a visitor is invited to copy.
	if (entry.metadata) {
		const { tile: _tile, ...metadata } = entry.metadata as Record<string, unknown>;
		if (Object.keys(metadata).length) {
			parts.push(`"metadata": ${JSON.stringify(metadata)}`);
		}
	}
	return `{ ${parts.join(', ')} }`;
}

function orderedKeys(layouts: ResponsiveFlexiLayout): string[] {
	const known = BREAKPOINT_KEYS.filter((key) => key in layouts) as string[];
	const rest = Object.keys(layouts).filter((key) => !isBreakpointKey(key));
	return [...known, ...rest];
}

/**
 * `JSON.stringify(layouts, null, 2)` runs to ~250 lines for three breakpoints;
 * one widget per line keeps it to ~40, and makes `x` / `y` visibly tick over as
 * a tile is dragged.
 */
export function formatLayouts(layouts: ResponsiveFlexiLayout): string {
	const breakpoints = orderedKeys(layouts);
	const lines: string[] = ['{'];

	breakpoints.forEach((breakpoint, breakpointIndex) => {
		const targets = Object.keys(layouts[breakpoint] ?? {});
		lines.push(`  ${JSON.stringify(breakpoint)}: {`);

		targets.forEach((targetKey, targetIndex) => {
			const entries = layouts[breakpoint][targetKey] ?? [];
			lines.push(`    ${JSON.stringify(targetKey)}: [`);
			entries.forEach((entry, index) => {
				lines.push(`      ${formatEntry(entry)}${index < entries.length - 1 ? ',' : ''}`);
			});
			lines.push(`    ]${targetIndex < targets.length - 1 ? ',' : ''}`);
		});

		lines.push(`  }${breakpointIndex < breakpoints.length - 1 ? ',' : ''}`);
	});

	lines.push('}');
	return lines.join('\n');
}
