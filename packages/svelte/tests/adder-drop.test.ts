import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import AdderBoard from './fixtures/adder-board.svelte';

let component: Record<string, any> | undefined;

afterEach(() => {
	if (component) unmount(component);
	component = undefined;
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('dropping a widget created by an adder', () => {
	it('completes the drop without stranding the dragged element', () => {
		// Regression: RenderedFlexiWidget read its controller through a $props()
		// getter. FlexiAdd clears that state partway through the release, so the
		// next core write re-ran the bridged read against undefined and threw,
		// aborting the portal's cleanup and leaving the widget stuck on screen.
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		component = mount(AdderBoard, { target: document.body });
		flushSync();

		const adder = document.querySelector('button.adder') as HTMLButtonElement;
		expect(adder).not.toBeNull();

		// Enter on the adder creates the widget and starts the drag-in on mount.
		adder.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
		flushSync();

		const portal = document.getElementById('flexi-portal');
		expect(portal).not.toBeNull();
		expect(portal!.children.length).toBe(1);

		// Release. The board's window handler dispatches widget:release, which is
		// where FlexiAdd clears its pending widget mid-flight.
		window.dispatchEvent(new Event('pointerup'));
		flushSync();

		// Nothing may be left behind in the portal.
		expect(portal!.children.length).toBe(0);

		// And the release must not have thrown anywhere along the chain.
		expect(errorSpy).not.toHaveBeenCalled();
	});
});
