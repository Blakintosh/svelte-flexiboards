import {
	FlexiDeleteController,
	InternalFlexiAddController,
	type FlexiAddClasses,
	type FlexiAddController,
	type FlexiAddWidgetFn,
	type FlexiCommonProps
} from '@flexiboards/core';
import { createContext, useContext, type ReactNode } from 'react';
import { useInternalFlexiBoard } from './board.js';
import { useSingleRef } from './utils.js';

export type FlexiAddProps = FlexiCommonProps<FlexiAddController> & {
	/**
	 * The class names to apply to the adder's button element. Either a class
	 * value, or a function deriving one from the adder's state.
	 */
	className?: FlexiAddClasses;

	/**
	 * The child content of the adder, containing the contents of the adder
	 * button.
	 */
	children?: (params: { adder: FlexiAddController }) => ReactNode;

	/**
	 * When the user interacts with the adder, this function allows you to
	 * specify the configuration of the widget that is created and grabbed.
	 * Return null to cancel the add.
	 */
	addWidget: FlexiAddWidgetFn;
};

export type FlexiDeleteProps = {
	/**
	 * The child content of the deleter, containing the contents of the deleter
	 * button.
	 */
	children?: ReactNode;
};

const FlexiAddContext = createContext<InternalFlexiAddController | null>(null);

export function useInternalFlexiAddOrNull() {
	return useContext(FlexiAddContext);
}

export function useInternalFlexiAdd() {
	const adder = useInternalFlexiAddOrNull();

	if (!adder) {
		throw new Error(
			'Cannot get FlexiAdd context outside of a registered adder. Ensure that <FlexiAdd> is called.'
		);
	}

	return adder;
}

export function useFlexiAdd() {
	return useInternalFlexiAdd() as FlexiAddController;
}

// addWidgetFn: FlexiAddWidgetFn

export function FlexiAdd({ children, ...props }: FlexiAddProps) {
	const provider = useInternalFlexiBoard();

	const adder = useSingleRef(() => new InternalFlexiAddController(provider, props.addWidget));

	// return {
	// 	adder,
	// 	onpointerdown: (event: PointerEvent) => adder.onpointerdown(event),
	// 	onkeydown: (event: KeyboardEvent) => adder.onkeydown(event)
	// };

	return (
		<FlexiAddContext.Provider value={adder}>
			{children?.({ adder })}
		</FlexiAddContext.Provider>
	);
}

const FlexiDeleteContext = createContext<FlexiDeleteController | null>(null);

export function FlexiDelete({ children }: FlexiDeleteProps) {
	const provider = useInternalFlexiBoard();
	const deleter = useSingleRef(() => new FlexiDeleteController(provider));

	return (
		<FlexiDeleteContext.Provider value={deleter}>
			{children}
		</FlexiDeleteContext.Provider>
	)
}
