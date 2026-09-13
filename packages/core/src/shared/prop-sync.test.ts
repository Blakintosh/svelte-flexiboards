import { describe, it, expect } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';
import { effect } from '../reactivity.js';
import { shallowEqual, changedKeys } from './prop-sync.js';

describe('shallowEqual', () => {
	it('compares by identity at depth 0', () => {
		expect(shallowEqual({ a: { v: 1 } }, { a: { v: 1 } })).toBe(false);
		const shared = { v: 1 };
		expect(shallowEqual({ a: shared }, { a: shared })).toBe(true);
	});

	it('compares one level into properties at depth 1', () => {
		// Inline object literals in props get fresh identity every render.
		expect(shallowEqual({ a: { v: 1 } }, { a: { v: 1 } }, 1)).toBe(true);
		expect(shallowEqual({ a: { v: 1 } }, { a: { v: 2 } }, 1)).toBe(false);
	});

	it('handles undefined and key-count mismatches', () => {
		expect(shallowEqual(undefined, undefined)).toBe(true);
		expect(shallowEqual(undefined, {})).toBe(false);
		expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
	});
});

describe('changedKeys', () => {
	it('reports only genuinely changed keys', () => {
		expect(changedKeys({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual(['b']);
		expect(changedKeys({ a: 1 }, { a: 1 })).toEqual([]);
	});

	it('ignores identity churn at depth 1', () => {
		expect(changedKeys({ a: { v: 1 } }, { a: { v: 1 } }, 1)).toEqual([]);
	});
});

describe('board prop seam', () => {
	const boardWith = (config: any) => new InternalFlexiBoardController({ config } as any, null);

	it('propagates a config mutation (the dashboard edit-mode bug)', () => {
		const config: any = { widgetDefaults: { draggability: 'none', resizability: 'none' } };
		const board = boardWith(config);

		const seen: (string | undefined)[] = [];
		effect(() => {
			seen.push(board.config$()?.widgetDefaults?.draggability);
		});
		expect(seen).toEqual(['none']);

		// Exactly what toggleEditMode() does.
		config.widgetDefaults = { draggability: 'full', resizability: 'horizontal' };
		board.updateProps({ config } as any);

		expect(seen).toEqual(['none', 'full']);
	});

	it('does not write when nothing changed — the loop guard', () => {
		const config: any = { widgetDefaults: { draggability: 'none' } };
		const board = boardWith(config);

		let runs = 0;
		effect(() => {
			board.config$();
			runs++;
		});
		expect(runs).toBe(1);

		// Simulates an effect re-running repeatedly: same values, fresh object
		// identities each time (inline literals / rest-props churn).
		for (let i = 0; i < 50; i++) {
			board.updateProps({ config: { widgetDefaults: { draggability: 'none' } } } as any);
		}

		expect(runs).toBe(1);
	});

	it('converges: a real change writes exactly once, then goes quiet', () => {
		const config: any = { widgetDefaults: { draggability: 'none' } };
		const board = boardWith(config);

		let runs = 0;
		effect(() => {
			board.config$();
			runs++;
		});

		board.updateProps({ config: { widgetDefaults: { draggability: 'full' } } } as any);
		expect(runs).toBe(2);

		for (let i = 0; i < 20; i++) {
			board.updateProps({ config: { widgetDefaults: { draggability: 'full' } } } as any);
		}
		expect(runs).toBe(2);
	});
});
