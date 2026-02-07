import { untrack } from 'svelte';
import { getInternalFlexiboardCtx } from '../board/index.js';
import type { InternalFlexiBoardController } from '../board/controller.svelte.js';
import { getPointerService, type PointerService } from '../shared/utils.svelte.js';
import type { ClassValue } from 'svelte/elements';
import { FlexiEventBus, getFlexiEventBus } from '../shared/event-bus.js';
import type { PointerMovedEvent } from '../types.js';

export type FlexiDeleteClassFunction = (deleter: FlexiDeleteController) => ClassValue;
export type FlexiDeleteClasses = ClassValue | FlexiDeleteClassFunction;

export class FlexiDeleteController {
	#provider: InternalFlexiBoardController;
	#pointerService: PointerService = getPointerService();
	#eventBus: FlexiEventBus = getFlexiEventBus();
	#unsubscribers: (() => void)[] = [];
	ref: HTMLElement | null = null;

	#inside: boolean = $state(false);

	constructor(provider: InternalFlexiBoardController) {
		this.#provider = provider;

		// Emulate pointer enter/leave events instead of relying on browser ones, so that we can
		// make it universal with our keyboard pointer.

		this.#unsubscribers.push(
			this.#eventBus.subscribe('pointer:moved', this.#onPointerMoved.bind(this))
		);
	}

	#onPointerMoved(event: PointerMovedEvent) {
		if (!this.ref) {
			return;
		}

		this.#updatePointerOverState(this.#pointerService.isPointerInside(this.ref));
	}

	#updatePointerOverState(inside: boolean) {
		const wasHovered = this.#inside;

		if (inside && !wasHovered) {
			this.#provider.onenterdeleter();
		} else if (!inside && wasHovered) {
			this.#provider.onleavedeleter();
		}

		this.#inside = inside;
	}

	get isHovered() {
		return this.#inside;
	}
}

export function flexidelete() {
	const provider = getInternalFlexiboardCtx();
	const deleter = new FlexiDeleteController(provider);

	return {
		deleter
	};
}
