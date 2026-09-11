import { useInternalFlexiBoard } from '../adapters/board.js';
import { useEffect } from 'react';

/**
 * @internal Rendered by FlexiBoard, after its children. Triggers the initial
 * client layout load after hydration. The first client render must retain
 * the server's declared/initialLayout content, even when storage differs.
 */
export function FlexiLayoutLoader() {
	const board = useInternalFlexiBoard();

	useEffect(() => board.oninitialloadcomplete(), [board]);

	return null;
}
