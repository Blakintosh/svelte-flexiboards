import { onDestroy, onMount } from 'svelte';
import { getFlexiEventBusCtx, type FlexiEventBus } from '../shared/event-bus.js';
import type { InternalFlexiBoardController } from './controller.svelte.js';

export function boardEvents(board: InternalFlexiBoardController) {
	const eventBus = getFlexiEventBusCtx();

	// Only the pointer that initiated the current action may end it — without this, a second
	// finger (or another button's pointerup) anywhere on the page would release the drag.
	// Keyboard-initiated actions have no pointerId and are ended via Enter/Escape.
	const isActionPointer = (event: PointerEvent) => {
		const action = board.currentWidgetAction;
		if (!action) {
			return false;
		}
		return action.pointerId === undefined || action.pointerId === event.pointerId;
	};

	const onpointerup = (event: PointerEvent) => {
		if (!isActionPointer(event)) {
			return;
		}

		eventBus.dispatch('widget:release', {
			board,
			target: board.hoveredTarget ?? undefined,
			widget: board.currentWidgetAction!.widget
		});
	};

	// Fired instead of pointerup when the browser/OS takes over the pointer (system gestures,
	// incoming calls, etc). Without this, the drag would be stuck mid-air with the viewport locked.
	const onpointercancel = (event: PointerEvent) => {
		if (!isActionPointer(event)) {
			return;
		}

		eventBus.dispatch('widget:cancel', {
			board,
			target: board.hoveredTarget ?? undefined,
			widget: board.currentWidgetAction!.widget
		});
	};

	const onkeydown = (event: KeyboardEvent) => {
		if (!board.currentWidgetAction) {
			return;
		}

		if (event.key == 'Escape') {
			eventBus.dispatch('widget:cancel', {
				board,
				widget: board.currentWidgetAction.widget,
				target: board.hoveredTarget ?? undefined
			});
		}

		if (event.key == 'Enter') {
			eventBus.dispatch('widget:release', {
				board,
				widget: board.currentWidgetAction.widget,
				target: board.hoveredTarget ?? undefined
			});
		}
	};

	onMount(() => {
		window.addEventListener('pointerup', onpointerup);
		window.addEventListener('pointercancel', onpointercancel);
		window.addEventListener('keydown', onkeydown);

		return () => {
			window.removeEventListener('pointerup', onpointerup);
			window.removeEventListener('pointercancel', onpointercancel);
			window.removeEventListener('keydown', onkeydown);
		};
	});
}
