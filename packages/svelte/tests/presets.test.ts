import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import Presets from './fixtures/presets.svelte';

let component: Record<string, any> | undefined;

afterEach(() => {
	if (component) unmount(component);
	component = undefined;
	document.body.innerHTML = '';
});

describe('presets', () => {
	it('FlexiSortable is a one-column flow list; FlexiDashboard a fixed free grid', () => {
		component = mount(Presets, { target: document.body });
		flushSync();
		const list = document.querySelector<HTMLElement>('[role="grid"].list')!;
		expect(list.getAttribute('aria-colcount')).toBe('1');
		expect(
			Array.from(list.querySelectorAll('[role="cell"]')).map((c) => c.getAttribute('aria-rowindex'))
		).toEqual(['0', '1']);

		const grid = document.querySelector<HTMLElement>('[role="grid"].grid')!;
		expect(grid.getAttribute('aria-colcount')).toBe('3');
		expect(grid.getAttribute('aria-rowcount')).toBe('2');
		const tile = grid.querySelector('[role="cell"]')!;
		expect(tile.getAttribute('aria-colspan')).toBe('2');
		expect(tile.getAttribute('aria-label')).toBe('Interactive widget');
	});
});
