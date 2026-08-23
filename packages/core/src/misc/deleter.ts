import type { InternalFlexiBoardController } from '../board/controller.js';
import { getPointerService, type PointerService } from '../shared/utils.js';
import { FlexiEventBus, getFlexiEventBus } from '../shared/event-bus.js';
import type { PointerMovedEvent, Signal } from '../types.js';
import { signal } from '../reactivity.js';

export type FlexiDeleteClassFunction<TClass = unknown> = (deleter: FlexiDeleteController) => TClass;
export type FlexiDeleteClasses<TClass = unknown> = TClass | FlexiDeleteClassFunction<TClass>;

export class FlexiDeleteController {
	#provider: InternalFlexiBoardController;
	#pointerService: PointerService = getPointerService();
	#eventBus: FlexiEventBus = getFlexiEventBus();
	#unsubscribers: (() => void)[] = [];

	/**
	 * The DOM element bound to this deleter.
	 */
	ref: HTMLElement | undefined = undefined;

	#inside$: Signal<boolean> = signal(false);

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
		const wasHovered = this.#inside$();

		if (inside && !wasHovered) {
			this.#provider.onenterdeleter();
		} else if (!inside && wasHovered) {
			this.#provider.onleavedeleter();
		}

		this.#inside$(inside);
	}

	/**
	 * Whether the deleter is currently being hovered by the pointer. Prefer
	 * this over CSS hover, because it accounts for Flexiboards' keyboard-based
	 * pointer.
	 */
	get isHovered(): boolean {
		return this.#inside$();
	}

	/**
	 * Cleans up the deleter's event subscriptions. Adapters call this when the
	 * component is destroyed.
	 */
	destroy() {
		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}
}

// TODO(adapter): removed flexidelete() — composition root that read the board context and constructed
// FlexiDeleteController(provider). Adapters must construct the controller with their board controller and
// call deleter.destroy() at unmount.
