// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { InternalFlexiBoardController } from './controller.js';
import { getPointerService } from '../shared/utils.js';

describe('destroying an active board', () => {
	it('restores document styles and removes its global cursor on destruction', () => {
		const style = document.documentElement.style;
		style.touchAction = 'pan-y';
		style.userSelect = 'text';
		style.overscrollBehaviorY = 'auto';
		const board = new InternalFlexiBoardController({});
		const idle = new InternalFlexiBoardController({});
		const target = board.createTarget({}, 'main');
		target.oninitialloadcomplete();
		const widget = target.createWidget({})!;
		getPointerService().enableKeyboardControls();
		board.onWidgetGrabbed({
			board,
			target,
			widget,
			clientX: 0,
			clientY: 0,
			xOffset: 0,
			yOffset: 0,
			capturedWidthPx: 100,
			capturedHeightPx: 100
		});
		expect(style.touchAction).toBe('none');
		idle.destroy();
		expect(style.touchAction).toBe('none');
		expect(getPointerService().keyboardControlsActive).toBe(true);
		board.destroy();
		board.destroy();
		expect(style.touchAction).toBe('pan-y');
		expect(style.userSelect).toBe('text');
		expect(style.overscrollBehaviorY).toBe('auto');
		expect(document.head.textContent).not.toContain('cursor: grabbing');
		expect(board.currentWidgetAction).toBeNull();
		expect(getPointerService().keyboardControlsActive).toBe(false);
		style.cssText = '';
	});
});
