import type { Action } from 'svelte/action';

/*
  Scroll reveal: adds `is-seen` once the element enters the lower ~88% of the
  viewport, once only. Fail-visible — if the observer never fires (print,
  unsupported, hidden tab), a timeout reveals it anyway. The motion itself is
  the `.reveal` utility in app.css; `delay` staggers siblings and `rise` scales
  the travel by importance (a lead card moves more than the ones after it).
*/
export type RevealOptions = number | { delay?: number; rise?: number };

/*
  Reveals are a first-impression device: they play on a fresh visit, never when
  the user is returning to content they have already seen. A hard back/forward
  load is detected here; client-side history navigation is reported by the root
  layout via setRevealsSuppressed (see +layout.svelte's beforeNavigate).
*/
let suppressed =
	typeof performance !== 'undefined' &&
	(performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)
		?.type === 'back_forward';

export function setRevealsSuppressed(value: boolean) {
	suppressed = value;
}

export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options = 0) => {
	// Returning via history: content appears settled, exactly as it was left.
	if (suppressed) {
		return;
	}

	const { delay = 0, rise } = typeof options === 'number' ? { delay: options } : options;
	node.classList.add('reveal');
	if (delay) node.style.setProperty('--reveal-delay', `${delay}ms`);
	if (rise !== undefined) node.style.setProperty('--rise', `${rise}px`);

	let tidy: ReturnType<typeof setTimeout> | undefined;

	const show = () => {
		node.classList.add('is-seen');
		observer?.disconnect();
		clearTimeout(failsafe);
		// Shed the utility once the entrance has landed: `.reveal` carries its own
		// `transition` shorthand, which would otherwise fight any hover/press
		// transitions the element declares for itself (e.g. the example cards).
		tidy = setTimeout(() => {
			node.classList.remove('reveal', 'is-seen');
			node.style.removeProperty('--reveal-delay');
			node.style.removeProperty('--rise');
		}, delay + 950);
	};

	let observer: IntersectionObserver | undefined;
	if (typeof IntersectionObserver !== 'undefined') {
		observer = new IntersectionObserver(
			(entries) => entries.some((e) => e.isIntersecting) && show(),
			{ rootMargin: '0px 0px -12% 0px' }
		);
		observer.observe(node);
	} else {
		show();
	}
	const failsafe = setTimeout(show, 4000);

	return {
		destroy() {
			observer?.disconnect();
			clearTimeout(failsafe);
			clearTimeout(tidy);
		}
	};
};
