import { getContext, setContext } from 'svelte';
import type { FlexiGrid } from '@flexiboards/core';
import { getInternalFlexitargetCtx } from './target.js';

const contextKey = Symbol('flexigrid');

export function flexigrid() {
	const target = getInternalFlexitargetCtx();

	// The grid controller may already exist, since initial widget creation runs
	// before this component and ensures it. Reuse it, or the widgets already
	// placed in it are lost.
	const grid = target.ensureGrid();
	setContext(contextKey, grid);

	// watchGridElementDimensions returns its own cleanup, so hand it to the
	// effect as its teardown and the watcher unsubscribes on destroy.
	$effect(() => grid.watchGridElementDimensions());

	return {
		grid
	};
}

export function getFlexigridCtx() {
	return getContext<FlexiGrid | undefined>(contextKey);
}
