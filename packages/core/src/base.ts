import { signal, type Signal } from './reactivity.js';

export abstract class FlexiControllerBase<T> {
	#state$: Signal<T>;

	protected get state(): T {
		return this.#state$();
	}

	protected set state(value: T) {
		this.#state$(value);
	}

	constructor(state: T) {
		this.#state$ = signal(state);
	}
}
