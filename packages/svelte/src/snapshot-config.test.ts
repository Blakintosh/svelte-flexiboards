import { describe, it, expect } from 'vitest';
import { snapshotConfig } from './adapter.svelte.js';

describe('snapshotConfig', () => {
	it('clones plain objects and arrays so core never aliases the source', () => {
		const config = {
			widgetDefaults: { transition: { move: { duration: 150, easing: 'ease' } } },
			list: [{ a: 1 }]
		};
		const snap = snapshotConfig(config);

		expect(snap).toEqual(config);
		expect(snap).not.toBe(config);
		expect(snap.widgetDefaults).not.toBe(config.widgetDefaults);
		expect(snap.widgetDefaults.transition).not.toBe(config.widgetDefaults.transition);
		expect(snap.list).not.toBe(config.list);
		expect(snap.list[0]).not.toBe(config.list[0]);

		// An in-place mutation of the source must not leak into an earlier snapshot.
		config.widgetDefaults.transition = { move: { duration: 300, easing: 'linear' } };
		expect(snap.widgetDefaults.transition.move.duration).toBe(150);
	});

	it('passes functions, class instances and collections through by reference', () => {
		class Registry {}
		const fn = () => {};
		const registry = new Registry();
		const map = new Map();
		const config = { fn, registry, map, undef: undefined, n: null };

		const snap = snapshotConfig(config);

		expect(snap.fn).toBe(fn);
		expect(snap.registry).toBe(registry);
		expect(snap.map).toBe(map);
		expect(snap.n).toBeNull();
		expect('undef' in snap).toBe(true);
	});

	it('handles cycles', () => {
		const config: any = { self: null };
		config.self = config;
		const snap = snapshotConfig(config);
		expect(snap.self).toBe(snap);
	});
});
