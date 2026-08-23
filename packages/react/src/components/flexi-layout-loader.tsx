import { useInternalFlexiBoard } from '../adapters/board.js';
import { useOnce } from '../adapters/utils.js';

/**
 * @internal Rendered by FlexiBoard, after its children. Triggers the initial
 * layout load — deliberately at render time (via useOnce), so it runs after
 * the earlier-sibling targets/widgets have registered (also render-time) but
 * before any mount effects, matching the Svelte init ordering.
 */
export function FlexiLayoutLoader() {
	const board = useInternalFlexiBoard();

	useOnce(() => board.oninitialloadcomplete());

	return null;
}
