import { useEffect } from 'react';
import { useInternalFlexiTarget } from '../adapters/target.js';

/**
 * @internal Rendered by FlexiTarget. Signals the target after mount that its
 * initial content is in place (Svelte's onMount timing).
 */
export function FlexiTargetLoader() {
	const target = useInternalFlexiTarget();

	useEffect(() => {
		target.oninitialloadcomplete();
	}, [target]);

	return null;
}
