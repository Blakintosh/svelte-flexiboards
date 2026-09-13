'use client';
import { cssTransitionConfig, type FlexiBoardConfiguration } from '@flexiboards/react';
import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(onChange: () => void) {
	const media = window.matchMedia(query);
	media.addEventListener('change', onChange);
	return () => media.removeEventListener('change', onChange);
}

/** Disable movement during SSR and hydration until the browser preference is known. */
export function useReducedMotion(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(query).matches,
		() => true
	);
}

const defaultTransition = cssTransitionConfig();

/** Registry defaults, with consumer settings preserved and reduced motion applied last. */
export function withMotion(
	config: FlexiBoardConfiguration | undefined,
	reducedMotion: boolean
): FlexiBoardConfiguration {
	return {
		...config,
		widgetDefaults: {
			transition: defaultTransition,
			...config?.widgetDefaults,
			...(reducedMotion && { transition: undefined })
		}
	};
}
