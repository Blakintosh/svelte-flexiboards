import { describe, it, expect, afterEach } from 'vitest';
import { FlexiEventBus } from './event-bus.js';
import { isSsrEnvironment, markSsrEnvironment } from './ssr.js';

describe('SSR environment flag', () => {
	afterEach(() => {
		markSsrEnvironment(false);
	});

	it('is off by default', () => {
		expect(isSsrEnvironment()).toBe(false);
	});

	it('drops event bus subscriptions while server-rendering', () => {
		markSsrEnvironment();

		const bus = new FlexiEventBus();
		let calls = 0;
		const unsubscribe = bus.subscribe('board:layoutchange', () => calls++);

		bus.dispatch('board:layoutchange', {} as never);
		expect(calls).toBe(0);

		// The returned unsubscriber must still be safe to call.
		expect(() => unsubscribe()).not.toThrow();
	});

	it('retains no listener references from SSR subscriptions', () => {
		markSsrEnvironment();

		const bus = new FlexiEventBus();
		bus.subscribe('widget:grabbed', () => {});

		// Once back on the client, a dispatch must not see the SSR listener.
		markSsrEnvironment(false);
		let calls = 0;
		bus.subscribe('widget:grabbed', () => calls++);
		bus.dispatch('widget:grabbed', {} as never);
		expect(calls).toBe(1);
	});

	it('re-claiming a keyed target during SSR resets it (bind: settle-loop re-render)', async () => {
		markSsrEnvironment();
		const { InternalFlexiBoardController } = await import('../board/controller.js');

		const board = new InternalFlexiBoardController({ config: {} });
		const layout = {
			type: 'flow',
			flowAxis: 'row',
			placementStrategy: 'append',
			rows: 3,
			columns: 1
		} as const;

		// First render pass of the target's component.
		const target = board.createTarget({ layout }, 'list');
		target.registerWidget({});
		target.registerWidget({});
		target.oninitialloadcomplete();
		expect(target.orderedWidgets).toHaveLength(2);

		// Svelte's settle loop renders the component again: same key, fresh
		// registrations. The target must not accumulate the first pass's widgets.
		const again = board.createTarget({ layout }, 'list');
		expect(again).toBe(target);
		expect(again.prepared).toBe(false);
		again.registerWidget({});
		again.registerWidget({});
		again.oninitialloadcomplete();
		expect(again.orderedWidgets).toHaveLength(2);
	});

	it('layoutPending flags a provisional loadLayout board through SSR, resolves on client init', async () => {
		const { InternalFlexiBoardController } = await import('../board/controller.js');

		// Server render: the callback is skipped, the layout stays provisional.
		markSsrEnvironment();
		const serverBoard = new InternalFlexiBoardController({
			config: { loadLayout: () => undefined }
		});
		expect(serverBoard.layoutPending).toBe(true);
		serverBoard.oninitialloadcomplete();
		expect(serverBoard.layoutPending).toBe(true);

		// Client init: the callback runs (even yielding nothing) and resolves it.
		markSsrEnvironment(false);
		const clientBoard = new InternalFlexiBoardController({
			config: { loadLayout: () => undefined }
		});
		expect(clientBoard.layoutPending).toBe(true);
		clientBoard.oninitialloadcomplete();
		expect(clientBoard.layoutPending).toBe(false);

		// No loadLayout: never pending.
		const plainBoard = new InternalFlexiBoardController({ config: {} });
		expect(plainBoard.layoutPending).toBe(false);
	});

	it('breakpointPending exposes the SSR breakpoint guess, null on the client', async () => {
		const { InternalResponsiveFlexiBoardController } = await import('../responsive/controller.js');

		markSsrEnvironment();
		const server = new InternalResponsiveFlexiBoardController({
			config: { breakpoints: { lg: 1024, sm: 640 }, ssrBreakpoint: 'lg' }
		});
		expect(server.currentBreakpoint).toBe('lg');
		expect(server.breakpointPending).toBe('lg');
		// Without a hint, the guess is the 'default' breakpoint — still flagged.
		const unhinted = new InternalResponsiveFlexiBoardController({
			config: { breakpoints: { lg: 1024, sm: 640 } }
		});
		expect(unhinted.breakpointPending).toBe('default');
		// Content-pending stays a separate signal: no loadLayouts, not layout-pending.
		expect(server.layoutPending).toBe(false);

		// The client's matchMedia answers immediately: never pending there.
		markSsrEnvironment(false);
		const client = new InternalResponsiveFlexiBoardController({
			config: { breakpoints: { lg: 1024, sm: 640 }, ssrBreakpoint: 'lg' }
		});
		expect(client.breakpointPending).toBe(null);
	});

	it('initialLayout renders in the pass itself, on server and client, with no pending window', async () => {
		const { InternalFlexiBoardController } = await import('../board/controller.js');

		const config = {
			registry: { note: {} },
			initialLayout: {
				list: [
					{ type: 'note', x: 0, y: 0, width: 1, height: 1 },
					{ type: 'note', x: 1, y: 0, width: 2, height: 1 }
				]
			}
		};
		const layout = {
			type: 'flow',
			flowAxis: 'row',
			placementStrategy: 'append',
			rows: 4,
			columns: 3
		} as const;

		for (const ssr of [true, false]) {
			markSsrEnvironment(ssr);
			const board = new InternalFlexiBoardController({ config });
			const target = board.createTarget({ layout }, 'list');
			// Declared widgets are superseded by the initial layout.
			target.registerWidget({});
			target.oninitialloadcomplete();
			expect(target.orderedWidgets.map((w) => [w.x, w.width])).toEqual([
				[0, 1],
				[1, 2]
			]);
			// Targets without an entry keep their declared widgets.
			const other = board.createTarget({ layout }, 'other');
			other.registerWidget({});
			other.oninitialloadcomplete();
			expect(other.orderedWidgets).toHaveLength(1);
			// The layout is data, not a deferred load: nothing is pending.
			expect(board.layoutPending).toBe(false);
		}
	});

	it('subscribes normally outside SSR', () => {
		const bus = new FlexiEventBus();
		let calls = 0;
		const unsubscribe = bus.subscribe('widget:release', () => calls++);

		bus.dispatch('widget:release', {} as never);
		expect(calls).toBe(1);

		unsubscribe();
		bus.dispatch('widget:release', {} as never);
		expect(calls).toBe(1);
	});
});
