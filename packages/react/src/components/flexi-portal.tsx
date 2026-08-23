import { destroyFlexiportal, flexiportal } from '@flexiboards/core';
import { useEffect } from 'react';
import { useInternalFlexiBoard } from '../adapters/board.js';

/**
 * @internal Rendered by FlexiBoard. Initialises the shared portal used to
 * render grabbed widgets over the pointer; reference-counted in core, so
 * multiple boards share one portal element.
 */
export function FlexiPortal() {
	const board = useInternalFlexiBoard();

	// Wait until mounted to the DOM before initialising the portal.
	useEffect(() => {
		flexiportal(board);

		return () => destroyFlexiportal();
	}, [board]);

	return null;
}
