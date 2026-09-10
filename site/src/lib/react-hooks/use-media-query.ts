import { useCallback, useSyncExternalStore } from 'react';

/**
 * React twin of `svelte/reactivity`'s MediaQuery: re-renders when the query's
 * match state changes. False on the server and during hydration, so the
 * first client render matches the server markup; the real value lands right
 * after, the same way MediaQuery's `current` does.
 */
export function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(notify: () => void) => {
			const mql = matchMedia(query);
			mql.addEventListener('change', notify);
			return () => mql.removeEventListener('change', notify);
		},
		[query]
	);

	return useSyncExternalStore(
		subscribe,
		() => matchMedia(query).matches,
		() => false
	);
}

const MOBILE_BREAKPOINT = 768;

/** Twin of `$lib/hooks/is-mobile.svelte`'s IsMobile. */
export function useIsMobile(): boolean {
	return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}
