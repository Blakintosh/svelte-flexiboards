import { useInternalFlexiBoard } from '../adapters/board.js';
import { useOnce } from '../adapters/utils.js';

/**
 * @internal Rendered by FlexiBoard, after its children. Triggers the initial
 * layout load at render time, via useOnce, so it runs after the earlier sibling
 * targets and widgets have registered but before any mount effects. That
 * matches the Svelte init ordering.
 */
export function FlexiLayoutLoader() {
	const board = useInternalFlexiBoard();

	useOnce(() => board.oninitialloadcomplete());

	return null;
}
