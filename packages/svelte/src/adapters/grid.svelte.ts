import { getContext, setContext } from 'svelte';
import type { FlexiGrid } from '@flexiboards/core';
import { getInternalFlexitargetCtx } from './target.js';

const contextKey = Symbol('flexigrid');

export function flexigrid() {
	const target = getInternalFlexitargetCtx();

	const grid = target.createGrid();
	setContext(contextKey, grid);

	// Tell the grid's dimension tracker to watch the grid element.
	$effect(() => {
		grid.watchGridElementDimensions();
	});

	return {
		grid
	};
}

export function getFlexigridCtx() {
	return getContext<FlexiGrid | undefined>(contextKey);
}
