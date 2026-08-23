import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import EditModeBoard from './fixtures/edit-mode-board.svelte';

let component: Record<string, any> | undefined;

afterEach(() => {
	if (component) unmount(component);
	component = undefined;
	document.body.innerHTML = '';
});

const grabButton = () => document.querySelector('button') as HTMLButtonElement | null;

describe('board config reactivity', () => {
	it('enables the grab handle when widgetDefaults change', () => {
		// Regression: config was captured once at construction, so toggling edit
		// mode never reached the widget and the handles stayed inert.
		component = mount(EditModeBoard, { target: document.body });
		flushSync();

		expect(grabButton()).not.toBeNull();
		expect(grabButton()!.disabled).toBe(true);

		component.toggleEditMode();
		flushSync();

		expect(grabButton()!.disabled).toBe(false);

		component.toggleEditMode();
		flushSync();

		expect(grabButton()!.disabled).toBe(true);
	});
});
