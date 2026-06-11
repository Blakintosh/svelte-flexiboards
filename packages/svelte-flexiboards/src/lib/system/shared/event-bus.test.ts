import { describe, expect, it, vi } from 'vitest';
import { FlexiEventBus } from './event-bus.js';

describe('FlexiEventBus', () => {
	it('notifies all listeners even when one unsubscribes during dispatch', () => {
		const bus = new FlexiEventBus();
		const calls: string[] = [];

		// Self-unsubscription during dispatch is routine (e.g. a widget destroying itself on
		// widget:delete) and must not shift later listeners out of the iteration.
		const unsubscribe = bus.subscribe('pointer:moved', () => {
			calls.push('first');
			unsubscribe();
		});
		bus.subscribe('pointer:moved', () => calls.push('second'));

		bus.dispatch('pointer:moved', { x: 0, y: 0 });

		expect(calls).toEqual(['first', 'second']);

		// And the unsubscription itself must have taken effect.
		bus.dispatch('pointer:moved', { x: 0, y: 0 });
		expect(calls).toEqual(['first', 'second', 'second']);
	});

	it('unsubscribes listeners independently', () => {
		const bus = new FlexiEventBus();
		const first = vi.fn();
		const second = vi.fn();

		const unsubscribeFirst = bus.subscribe('pointer:moved', first);
		bus.subscribe('pointer:moved', second);

		unsubscribeFirst();
		bus.dispatch('pointer:moved', { x: 0, y: 0 });

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledOnce();
	});
});
