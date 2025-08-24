import { untrack } from 'svelte';
import { getInternalFlexiboardCtx } from '../board/index.js';
import type { InternalFlexiBoardController } from '../board/controller.svelte.js';
import { getPointerService, type PointerService } from '../shared/utils.svelte.js';
import type { ClassValue } from 'svelte/elements';

export type FlexiDeleteClassFunction = (deleter: FlexiDeleteController) => ClassValue;
export type FlexiDeleteClasses = ClassValue | FlexiDeleteClassFunction;

export class FlexiDeleteController {
	#provider: InternalFlexiBoardController;
	#pointerService: PointerService = getPointerService();
	ref: HTMLElement | null = null;

	#inside: boolean = $state(false);

	constructor(provider: InternalFlexiBoardController) {
		this.#provider = provider;

		// Emulate pointer enter/leave events instead of relying on browser ones, so that we can
		// make it universal with our keyboard pointer.
		$effect(() => {
			if (!this.ref) {
				return;
			}

			const isPointerInside = this.#pointerService.isPointerInside(this.ref);

			// Only check when keyboard controls are active
			untrack(() => {
				this.#updatePointerOverState(isPointerInside);
			});
		});
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
		deleter,
		// TODO: remove in v0.4
		/** @deprecated */
		onpointerenter: () => {},
		/** @deprecated */
		onpointerleave: () => {}
	};
}
