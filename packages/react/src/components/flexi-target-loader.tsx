import { useInternalFlexiTarget } from '../adapters/target.js';
import { useOnce } from '../adapters/utils.js';

/**
 * @internal Creates widgets after declarations register and before the grid
 * reads them, so they appear in SSR output. Core consumes the registration
 * queue, so repeated calls cannot create duplicates.
 */
export function FlexiTargetLoader() {
	const target = useInternalFlexiTarget();

	useOnce(() => target.oninitialloadcomplete());

	return null;
}
