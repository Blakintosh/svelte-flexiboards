import type { InternalFlexiBoardController } from './provider.svelte.js';
import { generateUniqueId } from './utils.svelte.js';

export type AriaPoliteness = 'off' | 'polite' | 'assertive';

export class FlexiAnnouncerController {
	provider: InternalFlexiBoardController;

	#message: string | null = $state(null);
	#politeness: AriaPoliteness = $state('polite');
	#id = generateUniqueId('flexi-announcer-');

	#resetTimeout: ReturnType<typeof setTimeout> | null = $state(null);

	constructor(provider: InternalFlexiBoardController) {
		this.provider = provider;
	}

	announce(message: string, politeness: AriaPoliteness = 'polite') {
		this.#message = message;
		this.#politeness = politeness;

		if (this.#resetTimeout) {
			clearTimeout(this.#resetTimeout);
		}

		this.#resetTimeout = setTimeout(() => {
			this.#message = '';
			this.#resetTimeout = null;
		}, 5000);
	}

	get message() {
		return this.#message;
	}

	get politeness() {
		return this.#politeness;
	}

	get id() {
		return this.#id;
	}
}

export function flexiannouncer(provider: InternalFlexiBoardController) {
	const announcer = new FlexiAnnouncerController(provider);

	provider.attachAnnouncer(announcer);
	return announcer;
}
