import type { InternalFlexiBoardController } from '../board/controller.svelte.js';
import {
	getFlexiboardCtx,
	getInternalFlexiboardCtx,
	type FlexiBoardController
} from '../board/index.js';
import { FlexiEventBus, getFlexiEventBusCtx } from '../shared/event-bus.js';
import { getElementMidpoint, isGrabPointerEvent } from '../shared/utils.svelte.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { InternalFlexiWidgetController } from './controller.svelte.js';
import { WidgetPointerEventWatcher } from './triggers.svelte.js';

type WidgetEventSource = {
	widget: InternalFlexiWidgetController;
	target: InternalFlexiTargetController;
	board: InternalFlexiBoardController;
};

export function widgetEvents(widget: InternalFlexiWidgetController) {
	const eventBus = getFlexiEventBusCtx();
	const board = getInternalFlexiboardCtx();
	const eventWatcher = new WidgetPointerEventWatcher(widget, 'grab');

	return {
		onpointerdown: (event: PointerEvent) => {
			// Grabbing the widget directly only works if the widget does not have grabbers.
			if (widget.hasGrabbers) {
				return;
			}

			dispatchPointerDownGrab(eventBus, widget, board, event);
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
	const eventBus = getFlexiEventBusCtx();
	const board = getInternalFlexiboardCtx();

	return {
		onpointerdown: (event: PointerEvent) => dispatchPointerDownGrab(eventBus, widget, board, event),
		onkeydown: (event: KeyboardEvent) => dispatchKeyDownGrab(eventBus, widget, board, event)
	};
}

export function widgetResizerEvents(widget: InternalFlexiWidgetController) {
	const eventBus = getFlexiEventBusCtx();
	const board = getInternalFlexiboardCtx();

	return {
		onpointerdown: (event: PointerEvent) =>
			dispatchPointerDownResize(eventBus, widget, board, event),
		onkeydown: (event: KeyboardEvent) => dispatchKeyDownResize(eventBus, widget, board, event)
	};
}

/**
 * Releases the pointer capture on the event target, before dispatching a 'widget:grabbed' event.
 * @param eventBus The event bus to dispatch the event to.
 * @param widget The widget that was grabbed.
 * @param event The pointer event.
 */
function dispatchPointerDownGrab(
	eventBus: FlexiEventBus,
	widget: InternalFlexiWidgetController,
	board: InternalFlexiBoardController,
	event: PointerEvent
) {
	if (!widget.draggable || !widget.ref || !isGrabPointerEvent(event)) {
		return;
	}

	// TODO: this MIGHT not be necessary anymore, due to our simulated pointer watcher.
	// Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
	// (event.target as HTMLElement).releasePointerCapture(event.pointerId);

	// event.stopPropagation();
	// event.preventDefault();

	dispatchGrab(eventBus, widget, board, {
		clientX: event.clientX,
		clientY: event.clientY
	});
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
	if (!widget.draggable || !widget.ref || event.key !== 'Enter') {
		return;
	}

	// so that the board's listener doesn't interfere
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
	if (!widget.draggable || !widget.ref) {
		return;
	}

	const rect = widget.ref?.getBoundingClientRect();
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
 * Releases the pointer capture on the event target, before dispatching a 'widget:resizing' event.
 * @param eventBus The event bus to dispatch the event to.
 * @param widget The widget that was resized.
 * @param event The pointer event.
 */
function dispatchPointerDownResize(
	eventBus: FlexiEventBus,
	widget: InternalFlexiWidgetController,
	board: InternalFlexiBoardController,
	event: PointerEvent
) {
	if (!widget.resizable || !widget.ref) {
		return;
	}

	// Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
	// (event.target as HTMLElement).releasePointerCapture(event.pointerId);

	// event.stopPropagation();
	// event.preventDefault();

	dispatchResize(eventBus, widget, board, {
		clientX: event.clientX,
		clientY: event.clientY
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

	event.stopPropagation();
	event.preventDefault();

	const { x, y } = getElementMidpoint(event.target as HTMLElement);

	dispatchResize(eventBus, widget, board, {
		clientX: x,
		clientY: y
	});
}

/**
 * Dispatches a 'widget:resizing' event to the event bus.
 * @param eventBus The event bus to dispatch the event to.
 * @param widget The widget that was resized.
 * @param clientX The x-coordinate of the pointer event.
 * @param clientY The y-coordinate of the pointer event.
 */
function dispatchResize(
	eventBus: FlexiEventBus,
	widget: InternalFlexiWidgetController,
	board: InternalFlexiBoardController,
	{ clientX, clientY }: { clientX: number; clientY: number }
) {
	if (!widget.resizable || !widget.ref) {
		return;
	}

	const rect = widget.ref?.getBoundingClientRect();
	if (!rect) {
		return;
	}

	const boardRect = board.ref?.getBoundingClientRect();
	if (!boardRect) {
		return;
	}

	const left = rect.left - boardRect.left;
	const top = rect.top - boardRect.top;

	// TODO: resizing event schema
	eventBus.dispatch('widget:resizing', {
		widget,
		board,
		target: widget.internalTarget!,
		offsetX: clientX - left,
		offsetY: clientY - top,
		clientX,
		clientY,
		left,
		top,
		capturedHeightPx: rect.height,
		capturedWidthPx: rect.width
	});
}
