import { onDestroy, onMount } from 'svelte';
import { getFlexiEventBusCtx, type FlexiEventBus } from '../shared/event-bus.js';
import type { InternalFlexiBoardController } from './controller.svelte.js';

export function boardEvents(board: InternalFlexiBoardController) {
	const eventBus = getFlexiEventBusCtx();

	const onpointerup = (event: PointerEvent) => {
		if (!board.currentWidgetAction) {
			return;
		}

		eventBus.dispatch('widget:release', {
			board,
			target: board.hoveredTarget ?? undefined,
			widget: board.currentWidgetAction.widget
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
		window.addEventListener('keydown', onkeydown);

		return () => {
			window.removeEventListener('pointerup', onpointerup);
			window.removeEventListener('keydown', onkeydown);
		};
	});
}
