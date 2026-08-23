import { describe, it, expect, vi, afterEach } from 'vitest';
import { FlexiEventBus } from './event-bus.js';

describe('FlexiEventBus dispatch', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('contains a throwing subscriber so later ones still run', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const bus = new FlexiEventBus();
		const ran: string[] = [];

		bus.subscribe('widget:release', () => {
			ran.push('before');
		});
		bus.subscribe('widget:release', () => {
			throw new Error('boom');
		});
		// Cleanup subscribers (portal return, viewport unlock) register last, so a
		// throw upstream used to strand the dragged widget in the portal.
		bus.subscribe('widget:release', () => {
			ran.push('cleanup');
		});

		bus.dispatch('widget:release', {} as any);

		expect(ran).toEqual(['before', 'cleanup']);
		expect(errorSpy).toHaveBeenCalledOnce();
	});

	it('tolerates unsubscribing during dispatch', () => {
		const bus = new FlexiEventBus();
		const ran: string[] = [];

		const off = bus.subscribe('widget:release', () => {
			ran.push('first');
			off();
		});
		bus.subscribe('widget:release', () => {
			ran.push('second');
		});

		bus.dispatch('widget:release', {} as any);

		expect(ran).toEqual(['first', 'second']);
	});
});
