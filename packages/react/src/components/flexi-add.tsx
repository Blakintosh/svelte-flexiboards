import {
	assistiveTextStyleObject,
	InternalFlexiAddController,
	type FlexiAddClasses,
	type FlexiAddController
} from '@flexiboards/core';
import type { FlexiAddWidgetFn } from '../types.js';
import { useCallback, useId } from 'react';
import { useInternalFlexiBoard } from '../adapters/board.js';
import { FlexiAddContext } from '../adapters/misc.js';
import {
	controllerRef,
	forwardEvent,
	renderChildren,
	useOnceCommitted,
	useSingleRef,
	type FlexiChildren,
	type FlexiCommonProps
} from '../adapters/utils.js';
import { RenderedFlexiWidget } from './rendered-flexi-widget.js';
import { useFromCore } from '../adapter.js';
import { useReactive } from '../adapters/reactive.js';

export type FlexiAddProps = FlexiCommonProps<FlexiAddController> & {
	/**
	 * The class names to apply to the adder's button element. Either a class
	 * value, or a function deriving one from the adder's state.
	 */
	className?: FlexiAddClasses<string>;

	/**
	 * The child content of the adder, containing the contents of the adder
	 * button.
	 */
	children?: FlexiChildren<{ adder: FlexiAddController }>;

	/**
	 * When the user interacts with the adder, this function allows you to
	 * specify the configuration of the widget that is created and grabbed.
	 * Return null to cancel the add.
	 */
	addWidget: FlexiAddWidgetFn;
};

export function FlexiAdd({ children, className, addWidget, onfirstcreate }: FlexiAddProps) {
	const provider = useInternalFlexiBoard();

	const adder = useSingleRef(() => new InternalFlexiAddController(provider, addWidget));
	useOnceCommitted(() => onfirstcreate?.(adder as FlexiAddController));

	const assistiveTextId = useId();
	const publicAdder = useReactive(adder as FlexiAddController);

	// useFromCore: the user's class function may read signal-backed adder state.
	const derivedClassName = useFromCore(
		useCallback(() => {
			if (typeof className === 'function') {
				return className(adder);
			}
			return className;
		}, [adder, className])
	);

	// The adapter owns the adder's lifecycle (destroy at unmount).
	// The read must *call* the signal — tracking happens at read time.
	const newWidget = useFromCore(useCallback(() => adder.newWidget$(), [adder]));

	return (
		<FlexiAddContext.Provider value={adder}>
			<button
				className={derivedClassName}
				ref={controllerRef(adder)}
				aria-describedby={assistiveTextId}
				style={{ touchAction: 'none' }}
				onPointerDown={(e) => forwardEvent(e, adder.onpointerdown)}
				onKeyDown={(e) => forwardEvent(e, adder.onkeydown)}
			>
				<span style={assistiveTextStyleObject} id={assistiveTextId}>
					Press Enter to drag a new widget into this board.
				</span>
				{renderChildren(children, { adder: publicAdder })}
			</button>

			<div style={{ display: 'none' }}>
				{newWidget && <RenderedFlexiWidget widget={newWidget} />}
			</div>
		</FlexiAddContext.Provider>
	);
}
