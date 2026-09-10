import {
	assistiveTextStyleObject,
	FlexiDeleteController,
	type FlexiDeleteClasses
} from '@flexiboards/core';
import { useCallback, useId } from 'react';
import { useInternalFlexiBoard } from '../adapters/board.js';
import { FlexiDeleteContext } from '../adapters/misc.js';
import {
	controllerRef,
	renderChildren,
	useOnceCommitted,
	useSingleRef,
	type FlexiChildren,
	type FlexiCommonProps
} from '../adapters/utils.js';
import { useFromCore } from '../adapter.js';
import { useReactive } from '../adapters/reactive.js';

export type FlexiDeleteProps = FlexiCommonProps<FlexiDeleteController> & {
	/**
	 * The class names to apply to the deleter's container element. Either a
	 * class value, or a function deriving one from the deleter's state.
	 */
	className?: FlexiDeleteClasses<string>;

	/**
	 * The child content of the deleter, containing the contents of the deleter
	 * button.
	 */
	children?: FlexiChildren<{ deleter: FlexiDeleteController }>;
};

export function FlexiDelete({ children, className, onfirstcreate }: FlexiDeleteProps) {
	const provider = useInternalFlexiBoard();
	const deleter = useSingleRef(() => new FlexiDeleteController(provider));
	useOnceCommitted(() => onfirstcreate?.(deleter));
	const assistiveTextId = useId();
	const publicDeleter = useReactive(deleter);

	// useFromCore: the user's class function may read signal-backed adder state.
	const derivedClassName = useFromCore(
		useCallback(() => {
			if (typeof className === 'function') {
				return className(deleter);
			}
			return className;
		}, [deleter, className])
	);

	return (
		<FlexiDeleteContext.Provider value={deleter}>
			<div
				role="region"
				ref={controllerRef(deleter)}
				className={derivedClassName}
				aria-describedby={assistiveTextId}
			>
				<span style={assistiveTextStyleObject} id={assistiveTextId}>
					Drag a widget here and press Enter to delete it.
				</span>
				{renderChildren(children, { deleter: publicDeleter })}
			</div>
		</FlexiDeleteContext.Provider>
	);
}
