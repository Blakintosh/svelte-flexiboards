import { afterEach, expect, it, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import { cells } from '@flexiboards/testing';
import LateWidgetsBoard from './fixtures/late-widgets-board.svelte';

let component: ReturnType<typeof LateWidgetsBoard> | undefined;

afterEach(async () => {
	if (component) await unmount(component);
	component = undefined;
	vi.restoreAllMocks();
	document.body.innerHTML = '';
});

it('adds a conditional declaration once, binds its controller and updates its content', async () => {
	const onCreated = vi.fn();
	const onLayoutChange = vi.fn();
	component = mount(LateWidgetsBoard, {
		target: document.body,
		props: { onCreated, config: { onLayoutChange } }
	});
	flushSync();
	expect(cells().map((cell) => cell.textContent?.trim())).toEqual(['First']);
	component.add();
	flushSync();
	await Promise.resolve();
	expect(cells().map((cell) => cell.textContent?.trim())).toEqual(['First', 'Late']);
	expect(onCreated).toHaveBeenCalledOnce();
	expect(component.getController()?.userProvidedId).toBe('late');
	expect(onLayoutChange).toHaveBeenCalledOnce();
	expect(onLayoutChange.mock.calls[0][0].cards).toHaveLength(2);
	component.rename();
	component.add();
	flushSync();
	expect(cells().map((cell) => cell.textContent?.trim())).toEqual(['First', 'Updated']);
	expect(onCreated).toHaveBeenCalledOnce();
});

it.each([0, 2])('rejects a late declaration at blocked or out-of-bounds x=%s', async (x) => {
	const onCreated = vi.fn();
	const onLayoutChange = vi.fn();
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	component = mount(LateWidgetsBoard, {
		target: document.body,
		props: { x, onCreated, config: { onLayoutChange } }
	});
	flushSync();
	component.add();
	flushSync();
	await Promise.resolve();
	expect(cells().map((cell) => cell.textContent?.trim())).toEqual(['First']);
	expect(onCreated).not.toHaveBeenCalled();
	expect(onLayoutChange).not.toHaveBeenCalled();
	expect(component.getController()).toBeUndefined();
	expect(warn).toHaveBeenCalledOnce();
});
