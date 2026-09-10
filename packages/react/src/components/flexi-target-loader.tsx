import { useInternalFlexiTarget } from '../adapters/target.js';
import { useOnce } from '../adapters/utils.js';

/**
 * @internal Rendered by FlexiTarget, after its grid. Creates the target's
 * declared widgets — deliberately at render time (via useOnce) so it runs after
 * the children's registrations and before the board's layout loader, matching
 * the Svelte init ordering. Core consumes the registration queue, so a
 * repeated call cannot create duplicates.
 */
export function FlexiTargetLoader() {
	const target = useInternalFlexiTarget();

	useOnce(() => target.oninitialloadcomplete());

	return null;
}
