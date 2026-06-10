import { describe, expect, it, vi } from 'vitest';
import { immediateTriggerConfig, WidgetPointerEventWatcher } from './triggers.svelte.js';

vi.mock('../board/index.js', () => ({
	getInternalFlexiboardCtx: () => ({
		ref: {
			scrollLeft: 0,
			scrollTop: 0,
			getBoundingClientRect: () => ({
				left: 0,
				top: 0
			})
		}
	})
}));

function createPointerEvent() {
	return {
		button: 0,
		clientX: 0,
		clientY: 0,
		pointerId: 1,
		pointerType: 'mouse',
		preventDefault: vi.fn()
	} as unknown as PointerEvent & { preventDefault: ReturnType<typeof vi.fn> };
}

function createWidget(overrides: Record<string, unknown> = {}) {
	const triggerConfig = {
		default: immediateTriggerConfig(),
		mouse: immediateTriggerConfig()
	};

	return {
		grabTrigger: triggerConfig,
		isGrabbable: true,
		ref: undefined,
		resizable: true,
		resizeTrigger: triggerConfig,
		target: undefined,
		...overrides
	} as any;
}

describe('WidgetPointerEventWatcher', () => {
	it('does not prevent default when a grab cannot start', () => {
		const watcher = new WidgetPointerEventWatcher(createWidget({ isGrabbable: false }), 'grab');
		const event = createPointerEvent();

		watcher.onstartpointerdown(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('prevents default when a grab can start', () => {
		const watcher = new WidgetPointerEventWatcher(createWidget(), 'grab');
		const event = createPointerEvent();

		watcher.onstartpointerdown(event);

		expect(event.preventDefault).toHaveBeenCalledOnce();
	});

	it('does not prevent default when a resize cannot start', () => {
		const watcher = new WidgetPointerEventWatcher(createWidget({ resizable: false }), 'resize');
		const event = createPointerEvent();

		watcher.onstartpointerdown(event);

		expect(event.preventDefault).not.toHaveBeenCalled();
	});
});
