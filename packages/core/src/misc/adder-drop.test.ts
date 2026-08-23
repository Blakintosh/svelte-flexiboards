import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';
import { InternalFlexiAddController, dragInOnceMounted } from './adder.js';
import { getFlexiEventBus } from '../shared/event-bus.js';

beforeAll(() => {
	// The board locks the viewport on grab; core is otherwise DOM-free here.
	(globalThis as any).document ??= { documentElement: { style: {} } };
});

afterEach(() => {
	vi.restoreAllMocks();
});

const setup = () => {
	const board = new InternalFlexiBoardController({ config: {} } as any, null);
	const target = board.createTarget(
		{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 4 } } as any,
		'left'
	);
	target.createGrid();

	const adder = new InternalFlexiAddController(board, () => ({
		widget: { width: 1, height: 1 } as any
	}));
	adder.ref = {
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 10, height: 10 })
	} as any;

	return { board, target, adder, bus: getFlexiEventBus() };
};

/** Drives adder -> drag-in -> hover target, returning the pending widget. */
const dragIn = (ctx: ReturnType<typeof setup>) => {
	ctx.adder.onkeydown({ key: 'Enter', stopPropagation() {} } as any);
	const widget = ctx.adder.newWidget$()!;

	// The widget mounts under the adder, which kicks off the drag-in.
	dragInOnceMounted(ctx.adder, widget);
	ctx.bus.dispatch('target:pointerenter', { board: ctx.board, target: ctx.target } as any);

	return widget;
};

const release = (ctx: ReturnType<typeof setup>) => {
	ctx.bus.dispatch('widget:release', {
		board: ctx.board,
		target: ctx.board.hoveredTarget ?? undefined,
		widget: ctx.board.currentWidgetAction!.widget
	} as any);
};

describe('dropping a widget created by an adder', () => {
	it('places the widget and clears the adder', () => {
		const ctx = setup();
		const widget = dragIn(ctx);

		expect(ctx.board.currentWidgetAction?.action).toBe('grab');

		release(ctx);

		expect(ctx.adder.newWidget$()).toBeUndefined();
		expect(widget.currentAction).toBeNull();
		expect(ctx.board.currentWidgetAction).toBeNull();
		expect(ctx.target.widgets.has(widget)).toBe(true);
	});

	it('still runs cleanup subscribers when an earlier one throws mid-drop', () => {
		// Regression: the adapter's bridged reads run synchronously on core signal
		// writes. FlexiAdd clears its pending widget partway through the release,
		// so the write inside tryDropWidget re-ran a read whose prop had already
		// gone undefined and threw. That abort skipped every later subscriber —
		// including the portal's, which returns the dragged element to the DOM,
		// leaving the grabbed widget stranded on screen.
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const ctx = setup();
		const widget = dragIn(ctx);

		let cleanupRan = false;
		ctx.bus.subscribe('widget:release', () => {
			throw new TypeError("Cannot read properties of undefined (reading 'x')");
		});
		// Stands in for the portal, which subscribes last (it registers on mount).
		ctx.bus.subscribe('widget:release', () => {
			cleanupRan = true;
		});

		release(ctx);

		expect(cleanupRan).toBe(true);
		expect(errorSpy).toHaveBeenCalled();
		expect(ctx.adder.newWidget$()).toBeUndefined();
		expect(ctx.target.widgets.has(widget)).toBe(true);
	});
});
