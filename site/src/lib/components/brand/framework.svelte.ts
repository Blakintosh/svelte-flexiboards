import { browser } from '$app/environment';

export type Framework = 'svelte' | 'react';

export type FrameworkMeta = {
	id: Framework;
	label: string;
	/** Rides the label in the picker as "(new)" or "(preview)"; 'stable' shows nothing. */
	status: 'stable' | 'new' | 'preview';
	package: string;
};

export const frameworks: FrameworkMeta[] = [
	{ id: 'svelte', label: 'Svelte', status: 'stable', package: '@flexiboards/svelte' },
	{ id: 'react', label: 'React', status: 'new', package: '@flexiboards/react' }
];

/** Frameworks with no adapter yet: faint mono text in the picker, never a tab. */
export const plannedFrameworks = ['Vue'];

const STORAGE_KEY = 'flexiboards:framework';
/** Cookie mirror of the choice, so the server renders the right framework. */
export const FRAMEWORK_COOKIE = 'flexiboards-framework';

export function isFramework(value: unknown): value is Framework {
	return value === 'react' || value === 'svelte';
}

function readStored(): Framework {
	if (!browser) return 'svelte';
	const stored = localStorage.getItem(STORAGE_KEY);
	return isFramework(stored) ? stored : 'svelte';
}

function persist(fw: Framework) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, fw);
	document.cookie = `${FRAMEWORK_COOKIE}=${fw}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/*
  The accent is the framework's colour: fx-accent for Svelte, drafting-process
  blue for React. A switch ripples the change out radially from the last click
  (per-section transition delays), overshooting through a hotter tone before
  settling — see the `--fx-accent` @property block in app.css.
*/
const ACCENT_END: Record<Framework, string> = {
	svelte: '#e2452b',
	react: 'oklch(0.58 0.15 235)'
};
const ACCENT_OVERSHOOT: Record<Framework, string> = {
	svelte: 'oklch(0.68 0.22 33)',
	react: 'oklch(0.68 0.21 235)'
};
const ACCENT_HOVER: Record<Framework, string> = {
	svelte: '#c93a22',
	react: 'oklch(0.5 0.15 235)'
};

/** Content-swap phase during a framework switch (dissolve out, then in). */
export type SwapPhase = 'out' | 'in' | null;

/** How long the leaving content takes to dissolve before the swap lands. */
const SWAP_OUT_MS = 700;
/** How long the arriving content is considered "entering" (covers stagger). */
const SWAP_IN_MS = 1200;

function reducedMotion() {
	return browser && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The framework choice drives the install command and every code listing on the
 * page, and persists across pages.
 *
 * A switch is staged: `selected` (what the pickers show) moves immediately;
 * `current` (what content renders) follows once the old content has dissolved,
 * with `swap` exposing the phase so surfaces can style each half.
 */
class FrameworkStore {
	#current = $state<Framework>('svelte');
	#selected = $state<Framework>('svelte');
	#swap = $state<SwapPhase>(null);
	/** False until the stored choice has been read (server cookie or localStorage). */
	#hydrated = $state(false);

	#outTimer: ReturnType<typeof setTimeout> | undefined;
	#inTimer: ReturnType<typeof setTimeout> | undefined;
	#accentTimer: ReturnType<typeof setTimeout> | undefined;
	#pointer: { x: number; y: number } | null = null;

	get current() {
		return this.#current;
	}

	/** The picker-facing value: reacts to a click immediately. */
	get selected() {
		return this.#selected;
	}

	/** 'out' while old content dissolves, 'in' while new content arrives. */
	get swap() {
		return this.#swap;
	}

	set current(value: Framework) {
		this.switch(value);
	}

	switch(next: Framework) {
		if (next === this.#selected) return;
		this.#selected = next;
		persist(next);

		clearTimeout(this.#outTimer);
		clearTimeout(this.#inTimer);

		if (!browser || reducedMotion()) {
			this.#current = next;
			this.#swap = null;
			this.#applyAccent(next);
			return;
		}

		this.#swap = 'out';
		this.#outTimer = setTimeout(() => {
			this.#current = next;
			this.#swap = 'in';
			this.#applyAccent(next);
			this.#inTimer = setTimeout(() => (this.#swap = null), SWAP_IN_MS);
		}, SWAP_OUT_MS);
	}

	get meta() {
		return frameworks.find((f) => f.id === this.#current) ?? frameworks[0];
	}

	/** Meta for the *selected* framework — badges and pickers read this. */
	get selectedMeta() {
		return frameworks.find((f) => f.id === this.#selected) ?? frameworks[0];
	}

	get hydrated() {
		return this.#hydrated;
	}

	/**
	 * Call once from the root layout, during init (not in an effect), with the
	 * framework the server read from the cookie. Runs on the server too, so
	 * SSR renders the same framework the client will hydrate with; the
	 * cookie-less fallback is localStorage (visitors from before the cookie).
	 */
	hydrate(fromCookie: Framework | null) {
		this.#current = fromCookie ?? readStored();
		this.#selected = this.#current;
		this.#hydrated = true;
		if (!browser) return;
		if (!fromCookie) persist(this.#current);
		// Remember where the last press landed so the accent ripple starts there.
		document.addEventListener(
			'pointerdown',
			(e) => (this.#pointer = { x: e.clientX, y: e.clientY }),
			{ capture: true, passive: true }
		);
		// The accent is already right via `data-framework` on <html>; only the
		// hover token lives on inline style.
		document.documentElement.style.setProperty('--fx-accent-hover', ACCENT_HOVER[this.#current]);
	}

	/** Stagger each section's accent transition by its distance from the click. */
	#radialDelays(x: number, y: number) {
		document.querySelectorAll<HTMLElement>('header, section, footer').forEach((el) => {
			const r = el.getBoundingClientRect();
			const cx = Math.max(r.left, Math.min(x, r.right));
			const cy = Math.max(r.top, Math.min(y, r.bottom));
			el.style.transitionDelay = `${Math.round(Math.hypot(cx - x, cy - y) * 0.55)}ms`;
		});
	}

	#applyAccent(fw: Framework) {
		if (!browser) return;
		// Keep the server-stamped attribute in step (inline style wins meanwhile).
		document.documentElement.dataset.framework = fw;
		const style = document.documentElement.style;
		style.setProperty('--fx-accent-hover', ACCENT_HOVER[fw]);
		clearTimeout(this.#accentTimer);
		if (reducedMotion()) {
			style.setProperty('--fx-accent', ACCENT_END[fw]);
			return;
		}
		// Ripple out radially from the last click, overshooting through a hotter
		// tone before settling on the end colour.
		const p = this.#pointer ?? { x: innerWidth / 2, y: 0 };
		this.#radialDelays(p.x, p.y);
		style.setProperty('--fx-accent', ACCENT_OVERSHOOT[fw]);
		this.#accentTimer = setTimeout(() => style.setProperty('--fx-accent', ACCENT_END[fw]), 300);
	}
}

export const framework = new FrameworkStore();
