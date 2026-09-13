import { cssTransitionConfig, type FlexiBoardConfiguration } from '@flexiboards/svelte';
import { MediaQuery } from 'svelte/reactivity';

export const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)', true);

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
