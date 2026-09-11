import { destroyFlexiportal, flexiportal } from '@flexiboards/core';
import { useEffect } from 'react';
import { useInternalFlexiBoard } from '../adapters/board.js';

/**
 * @internal Rendered by FlexiBoard. Initialises the shared portal that renders
 * grabbed widgets over the pointer. Core reference-counts it, so multiple
 * boards share one portal element.
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
