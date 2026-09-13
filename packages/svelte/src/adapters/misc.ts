import { getContext, hasContext, onDestroy, setContext } from 'svelte';
import {
	FlexiDeleteController,
	InternalFlexiAddController,
	type FlexiAddController,
	type FlexiAddWidgetFn
} from '@flexiboards/core';
import { getInternalFlexiboardCtx } from './board.js';
import { reactive } from '../adapter.svelte.js';

const contextKey = Symbol('flexiadd');

export function hasInternalFlexiaddCtx() {
	return hasContext(contextKey);
}

export function getInternalFlexiaddCtx() {
	const adder = getContext<InternalFlexiAddController | undefined>(contextKey);

	if (!adder) {
		throw new Error(
			'Cannot get FlexiAdd context outside of a registered adder. Ensure that flexiadd() (or <FlexiAdd>) is called.'
		);
	}

	return adder;
}

export function getFlexiaddCtx() {
	return reactive(getInternalFlexiaddCtx() as FlexiAddController);
}

export function flexiadd(addWidgetFn: FlexiAddWidgetFn) {
	const provider = getInternalFlexiboardCtx();

	const adder = new InternalFlexiAddController(provider, addWidgetFn);
	setContext(contextKey, adder);

	onDestroy(() => adder.destroy());

	return {
		adder,
		onpointerdown: (event: PointerEvent) => adder.onpointerdown(event),
		onkeydown: (event: KeyboardEvent) => adder.onkeydown(event)
	};
}

export function flexidelete() {
	const provider = getInternalFlexiboardCtx();
	const deleter = new FlexiDeleteController(provider);

	onDestroy(() => deleter.destroy());

	return {
		deleter
	};
}
