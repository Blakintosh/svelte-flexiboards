import { expect, it, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import FormButtons from './fixtures/form-buttons.svelte';

it('does not submit the containing form from interaction buttons', async () => {
	const host = document.createElement('div');
	document.body.appendChild(host);
	const component = mount(FormButtons, { target: host });
	try {
		flushSync();
		const submit = vi.fn((event: Event) => event.preventDefault());
		host.querySelector('form')!.addEventListener('submit', submit);
		const buttons = [...host.querySelectorAll('button')];
		expect(buttons).toHaveLength(3);
		for (const button of buttons) {
			expect(button.disabled).toBe(false);
			button.click();
		}
		expect(submit).not.toHaveBeenCalled();
	} finally {
		await unmount(component);
		host.remove();
	}
});
