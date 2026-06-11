import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import { getInternalFlexiboardCtx } from '../board/index.js';
import type { InternalFlexiWidgetController } from './controller.svelte.js';
import type { FlexiWidgetTriggerConfiguration } from './types.js';
import { isGrabPointerEvent, isInteractiveElement } from '../shared/utils.svelte.js';

interface PointerDownTriggerCondition {
	type: 'immediate';
}

interface PointerLongPressTriggerCondition {
	type: 'longPress';
	duration: number;
}

export const immediateTriggerConfig = (): PointerDownTriggerCondition => ({ type: 'immediate' });
export const longPressTriggerConfig = (duration?: number): PointerLongPressTriggerCondition => ({
	type: 'longPress',
	duration: duration ?? 300
});

export type PointerTriggerCondition =
	| PointerDownTriggerCondition
	| PointerLongPressTriggerCondition;

/**
 * Watches pointer events on a widget, issuing a grab event to the widget if the event satisfies the configured behaviour.
 * (e.g. long press for touch)
 */
export class WidgetPointerEventWatcher {
	#widget: InternalFlexiWidgetController = $state() as InternalFlexiWidgetController;
	#type: 'grab' | 'resize' = $state('grab');

	#triggerConfig: FlexiWidgetTriggerConfiguration = $derived(
		this.#type == 'resize' ? this.#widget.resizeTrigger : this.#widget.grabTrigger
	);

	#eventBus: FlexiEventBus;
	#board = getInternalFlexiboardCtx();

	constructor(widget: InternalFlexiWidgetController, type: 'grab' | 'resize') {
		this.#widget = widget;
		this.#type = type;

		this.#eventBus = getFlexiEventBus();
	}

	onstartpointerdown(event: PointerEvent) {
		if (!isGrabPointerEvent(event)) {
			return;
		}

		if (!this.#canStartWidgetEvent()) {
			return;
		}

		// Only one widget action can be active at a time. Without this gate, a second pointer
		// (e.g. multi-touch) would put another widget into a grabbed state that the board ignores
		// and that never gets released.
		if (this.#board.currentWidgetAction) {
			return;
		}

		// Pointer-downs on interactive content inside the widget (inputs, buttons, links, ...)
		// belong to that content — starting a grab here (and calling preventDefault) would make
		// it impossible to focus or activate.
		if (isInteractiveElement(event.target)) {
			return;
		}

		const pointerType = event.pointerType;

		const triggerForType = this.#triggerConfig[pointerType] ?? this.#triggerConfig.default;

		if (triggerForType.type == 'longPress') {
			// No preventDefault here: until the press resolves, the pointer-down may still be a
			// tap, scroll or text selection, which must behave normally.
			return this.#handleLongPress(event, triggerForType);
		}

		event.preventDefault();
		return this.#triggerWidgetEvent(event);
	}

	#eventTimeout: ReturnType<typeof setTimeout> | null = null;

	#canStartWidgetEvent() {
		if (this.#type == 'resize') {
			return this.#widget.resizable;
		}

		return this.#widget.isGrabbable;
	}

	#handleLongPress(event: PointerEvent, trigger: PointerLongPressTriggerCondition) {
		if (this.#eventTimeout) {
			clearTimeout(this.#eventTimeout);
		}

		const startX = event.clientX;
		const startY = event.clientY;
		const pointerId = event.pointerId;

		const moveThreshold = 16; // 16px movement threshold
		let isPointerDown = true;
		let currentX = startX;
		let currentY = startY;

		// Track if pointer is still down and its position
		const pointerUpHandler = (e: PointerEvent) => {
			if (e.pointerId === pointerId) {
				isPointerDown = false;
				document.removeEventListener('pointerup', pointerUpHandler);
				document.removeEventListener('pointercancel', pointerUpHandler);
				document.removeEventListener('pointermove', pointerMoveHandler);
			}
		};

		// Track pointer movement
		const pointerMoveHandler = (e: PointerEvent) => {
			if (e.pointerId === pointerId) {
				e.preventDefault();
				currentX = e.clientX;
				currentY = e.clientY;
			}
		};

		document.addEventListener('pointerup', pointerUpHandler);
		document.addEventListener('pointercancel', pointerUpHandler);
		document.addEventListener('pointermove', pointerMoveHandler);

		this.#eventTimeout = setTimeout(() => {
			// Only trigger if pointer is still down and hasn't moved too much
			if (isPointerDown) {
				const distance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

				if (distance <= moveThreshold) {
					this.#triggerWidgetEvent(event);
				}
			}

			document.removeEventListener('pointerup', pointerUpHandler);
			document.removeEventListener('pointercancel', pointerUpHandler);
			document.removeEventListener('pointermove', pointerMoveHandler);
		}, trigger.duration);
	}

	#triggerWidgetEvent(event: PointerEvent) {
		if (!this.#widget.ref) {
			return;
		}

		const rect = this.#widget.ref.getBoundingClientRect();
		if (!rect) {
			return;
		}

		if (this.#type == 'resize') {
			if (!this.#widget.resizable) {
				return;
			}

			// For resize, calculate position relative to board container.
			const boardRect = this.#board.ref?.getBoundingClientRect();
			if (!boardRect) {
				return;
			}

			const left = rect.left - boardRect.left + this.#board.ref!.scrollLeft;
			const top = rect.top - boardRect.top + this.#board.ref!.scrollTop;

			this.#eventBus.dispatch('widget:resizing', {
				widget: this.#widget,
				board: this.#board,
				target: this.#widget.target as any,
				offsetX: event.clientX - left,
				offsetY: event.clientY - top,
				clientX: event.clientX,
				clientY: event.clientY,
				left,
				top,
				capturedHeightPx: rect.height,
				capturedWidthPx: rect.width,
				pointerId: event.pointerId
			});
			return;
		}

		if (!this.#widget.isGrabbable) {
			return;
		}

		this.#eventBus.dispatch('widget:grabbed', {
			widget: this.#widget,
			board: this.#board,
			target: this.#widget.target as any,
			clientX: event.clientX,
			clientY: event.clientY,
			capturedHeightPx: rect.height,
			capturedWidthPx: rect.width,
			xOffset: event.clientX - rect.left,
			yOffset: event.clientY - rect.top,
			pointerId: event.pointerId
		});
	}
}
