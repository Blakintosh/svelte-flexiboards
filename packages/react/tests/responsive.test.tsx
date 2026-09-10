import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act } from 'react';
import {
	FlexiBoard,
	FlexiTarget,
	FlexiWidget,
	ResponsiveFlexiBoard,
	useResponsiveFlexiBoard
} from '../src/index.js';
import { cells, flushTimers, mount, type Mounted } from './helpers.js';

let mounted: Mounted | undefined;

// A controllable matchMedia: every query gets the same match state, and
// setWidth() flips them and notifies listeners like a real viewport change.
type Listener = (e: { matches: boolean }) => void;
let queries: { query: string; listeners: Set<Listener> }[] = [];
let width = 1280;

function matches(query: string) {
	const min = /min-width:\s*(\d+)/.exec(query);
	const max = /max-width:\s*([\d.]+)/.exec(query);
	if (min && width < Number(min[1])) return false;
	if (max && width > Number(max[1])) return false;
	return true;
}

function setWidth(w: number) {
	width = w;
	act(() => {
		for (const q of queries) {
			const m = matches(q.query);
			q.listeners.forEach((l) => l({ matches: m }));
		}
	});
}

beforeEach(() => {
	queries = [];
	width = 1280;
	window.matchMedia = ((query: string) => {
		const entry = { query, listeners: new Set<Listener>() };
		queries.push(entry);
		return {
			get matches() {
				return matches(query);
			},
			media: query,
			addEventListener: (_: string, l: Listener) => entry.listeners.add(l),
			removeEventListener: (_: string, l: Listener) => entry.listeners.delete(l)
		} as unknown as MediaQueryList;
	}) as typeof window.matchMedia;
});

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

const freeLayout = {
	layout: {
		type: 'free',
		minColumns: 3,
		maxColumns: 3,
		minRows: 3,
		maxRows: 3
	}
} as const;

function Breakpoint() {
	const board = useResponsiveFlexiBoard();
	return <span className="bp">{board.currentBreakpoint}</span>;
}

describe('ResponsiveFlexiBoard', () => {
	it('renders the production for the current breakpoint and switches when the viewport changes', () => {
		mounted = mount(
			<ResponsiveFlexiBoard
				config={{ breakpoints: { lg: 1024 } }}
				lg={
					<FlexiBoard className="lg">
						<Breakpoint />
						<FlexiTarget keyName="left" config={freeLayout}>
							<FlexiWidget x={0} y={0} width={2} height={1}>
								wide
							</FlexiWidget>
						</FlexiTarget>
					</FlexiBoard>
				}
			>
				{({ currentBreakpoint }) => (
					<FlexiBoard className={`fallback-${currentBreakpoint}`}>
						<Breakpoint />
						<FlexiTarget keyName="left" config={freeLayout}>
							<FlexiWidget x={0} y={0} width={1} height={1}>
								narrow
							</FlexiWidget>
						</FlexiTarget>
					</FlexiBoard>
				)}
			</ResponsiveFlexiBoard>,
			{ strict: true }
		);
		expect(document.querySelector('.lg')).not.toBeNull();
		expect(document.querySelector('.bp')!.textContent).toBe('lg');
		expect(cells()[0].textContent).toBe('wide');

		setWidth(600);
		expect(document.querySelector('.lg')).toBeNull();
		expect(document.querySelector('.fallback-default')).not.toBeNull();
		expect(document.querySelector('.bp')!.textContent).toBe('default');
		expect(cells().map((c) => c.textContent)).toEqual(['narrow']);

		setWidth(1400);
		expect(document.querySelector('.lg')).not.toBeNull();
		expect(cells().map((c) => c.textContent)).toEqual(['wide']);
	});

	it('loads stored layouts per breakpoint and reports changes', () => {
		const onLayoutsChange = vi.fn();
		const loadLayouts = vi.fn(() => ({
			lg: {
				left: [
					{
						type: 't',
						x: 0,
						y: 0,
						width: 3,
						height: 1,
						metadata: { k: 'stored-lg' }
					}
				]
			}
		}));
		mounted = mount(
			<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024 }, loadLayouts, onLayoutsChange }}>
				<FlexiBoard config={{ registry: { t: {} } }}>
					<FlexiTarget keyName="left" config={freeLayout}>
						<FlexiWidget type="t" x={0} y={0} width={1} height={1}>
							{({ widget }) => <span>{String(widget.metadata?.k ?? 'declared')}</span>}
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
			</ResponsiveFlexiBoard>,
			{ strict: true }
		);
		expect(loadLayouts).toHaveBeenCalled();
		// Imported layouts have no snippet of their own; the widget renders empty.
		expect(cells().length).toBe(1);
		expect(cells()[0].getAttribute('aria-colspan')).toBe('3');
	});
});
