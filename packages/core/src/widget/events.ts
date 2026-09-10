import type { InternalFlexiBoardController } from '../board/controller.js';
import { FlexiEventBus, getFlexiEventBus } from '../shared/event-bus.js';
import { getElementMidpoint, getLayoutRect, isGrabPointerEvent } from '../shared/utils.js';
import type { InternalFlexiTargetController } from '../target/controller.js';
import type { InternalFlexiWidgetController } from './controller.js';
import { WidgetPointerEventWatcher } from './triggers.js';

type WidgetEventSource = {
	widget: InternalFlexiWidgetController;
	target: InternalFlexiTargetController;
	board: InternalFlexiBoardController;
};

export function widgetEvents(widget: InternalFlexiWidgetController) {
	const eventBus = getFlexiEventBus();
	const board = widget.provider;
	const grabWatcher = new WidgetPointerEventWatcher(widget, 'grab');

	return {
		onpointerdown: (event: PointerEvent) => {
			// Grabbing the widget directly only works if the widget does not have grabbers.
			if (widget.hasGrabbers) {
				return;
			}

			// Invoke the trigger watcher which respects trigger configuration (immediate vs long press).
			grabWatcher.onstartpointerdown(event);
		},
		onkeydown: (event: KeyboardEvent) => {
			// Grabbing the widget directly only works if the widget does not have grabbers.
			if (widget.hasGrabbers) {
				return;
			}

			dispatchKeyDownGrab(eventBus, widget, board, event);
		}
	};
}

export function widgetGrabberEvents(widget: InternalFlexiWidgetController) {
	const eventBus = getFlexiEventBus();
	const board = widget.provider;
	const grabWatcher = new WidgetPointerEventWatcher(widget, 'grab');

	return {
		onpointerdown: (event: PointerEvent) => {
			// Don't propagate to parent widget, preventing double-grab dispatch
			event.stopPropagation();
			// Use the trigger watcher which respects trigger configuration (immediate vs long press)
			grabWatcher.onstartpointerdown(event);
		},
		onkeydown: (event: KeyboardEvent) => dispatchKeyDownGrab(eventBus, widget, board, event)
	};
}

export function widgetResizerEvents(widget: InternalFlexiWidgetController) {
	const eventBus = getFlexiEventBus();
	const board = widget.provider;
	const resizeWatcher = new WidgetPointerEventWatcher(widget, 'resize');

	// Don't propagate events upwards, so that it never also triggers a grab action.
	return {
		onpointerdown: (event: PointerEvent) => {
			event.stopPropagation();
			// Invoke the trigger watcher which respects trigger configuration (immediate vs long press).
			resizeWatcher.onstartpointerdown(event);
		},
		onkeydown: (event: KeyboardEvent) => {
			event.stopPropagation();
			dispatchKeyDownResize(eventBus, widget, board, event);
		}
	};
}

/**
 * Resolves clientX/clientY coordinates from a keyboard event, before dispatching a 'widget:grabbed' event.
 * @param eventBus The event bus to dispatch the event to.
 * @param widget The widget that was grabbed.
 * @param event The keyboard event.
 */
function dispatchKeyDownGrab(
	eventBus: FlexiEventBus,
	widget: InternalFlexiWidgetController,
	board: InternalFlexiBoardController,
	event: KeyboardEvent
) {
	if (!widget.isGrabbable || !widget.ref || event.key !== 'Enter') {
		return;
	}

	// If an action is already active, do not intercept Enter.
	// Let it bubble to the board so it can confirm (release) the action.
	if (board.currentWidgetAction) {
		return;
	}

	// No action active; start a grab from keyboard and prevent the board from also handling it.
	event.stopPropagation();
	event.preventDefault();

	const { x, y } = getElementMidpoint(event.target as HTMLElement);

	dispatchGrab(eventBus, widget, board, {
		clientX: x,
		clientY: y
	});
}

/**
 * Dispatches a 'widget:grabbed' event to the event bus.
 * @param eventBus The event bus to dispatch the event to.
 * @param widget The widget that was grabbed.
 * @param clientX The x-coordinate of the pointer event.
 * @param clientY The y-coordinate of the pointer event.
 */
function dispatchGrab(
	eventBus: FlexiEventBus,
	widget: InternalFlexiWidgetController,
	board: InternalFlexiBoardController,
	{ clientX, clientY }: { clientX: number; clientY: number }
) {
	if (!widget.isGrabbable || !widget.ref) {
		return;
	}

	// Layout rect, not gBCR: a decorative transform on the widget (grab tilt,
	// hover scale) must not skew the captured size or pointer offsets.
	const rect = getLayoutRect(widget.ref);
	if (!rect) {
		return;
	}

	eventBus.dispatch('widget:grabbed', {
		widget,
		board,
		target: widget.internalTarget,
		clientX,
		clientY,
		capturedHeightPx: rect.height,
		capturedWidthPx: rect.width,
		xOffset: clientX - rect.left,
		yOffset: clientY - rect.top
	});
}

/**
 * Resolves clientX/clientY coordinates from a keyboard event, before dispatching a 'widget:resizing' event.
 * @param eventBus The event bus to dispatch the event to.
 * @param widget The widget that was resized.
 * @param event The keyboard event.
 */
function dispatchKeyDownResize(
	eventBus: FlexiEventBus,
	widget: InternalFlexiWidgetController,
	board: InternalFlexiBoardController,
	event: KeyboardEvent
) {
	if (!widget.resizable || !widget.ref || event.key !== 'Enter') {
		return;
	}

	// If an action is already active, do not intercept Enter.
	// Let it bubble to the board so it can confirm (release) the action.
	if (board.currentWidgetAction) {
		return;
	}

	event.stopPropagation();
	event.preventDefault();

	const rect = getLayoutRect(widget.ref);
	if (!rect) {
		return;
	}

	const boardRect = board.ref?.getBoundingClientRect();
	if (!boardRect) {
		return;
	}

	const { x, y } = getElementMidpoint(event.target as HTMLElement);

	// Calculate position relative to board container (same as resize trigger logic)
	const left = rect.left - boardRect.left + board.ref!.scrollLeft;
	const top = rect.top - boardRect.top + board.ref!.scrollTop;

	eventBus.dispatch('widget:resizing', {
		widget,
		board,
		target: widget.internalTarget!,
		offsetX: x - left,
		offsetY: y - top,
		clientX: x,
		clientY: y,
		left,
		top,
		capturedHeightPx: rect.height,
		capturedWidthPx: rect.width
	});
}
