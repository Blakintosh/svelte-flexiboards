import { browser } from '$app/environment';

export type Framework = 'svelte' | 'react';

export type FrameworkMeta = {
	id: Framework;
	label: string;
	/** Sentence case, rides the label in the picker. Null once an adapter is stable. */
	status: 'stable' | 'preview';
	package: string;
};

export const frameworks: FrameworkMeta[] = [
	{ id: 'svelte', label: 'Svelte', status: 'stable', package: '@flexiboards/svelte' },
	{ id: 'react', label: 'React', status: 'preview', package: '@flexiboards/react' }
];

/** Frameworks with no adapter yet: faint mono text in the picker, never a tab. */
export const plannedFrameworks = ['Vue'];

const STORAGE_KEY = 'flexiboards:framework';

function readStored(): Framework {
	if (!browser) return 'svelte';
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'react' || stored === 'svelte' ? stored : 'svelte';
}

/**
 * The framework choice drives the install command and every code listing on the
 * page, and persists across pages.
 */
class FrameworkStore {
	#current = $state<Framework>('svelte');
	/** False until the stored choice has been read, so SSR and hydration agree. */
	#hydrated = $state(false);

	get current() {
		return this.#current;
	}

	set current(value: Framework) {
		this.#current = value;
		if (browser) localStorage.setItem(STORAGE_KEY, value);
	}

	get meta() {
		return frameworks.find((f) => f.id === this.#current) ?? frameworks[0];
	}

	get hydrated() {
		return this.#hydrated;
	}

	/** Call once from the root layout. */
	hydrate() {
		this.#current = readStored();
		this.#hydrated = true;
	}
}

export const framework = new FrameworkStore();
