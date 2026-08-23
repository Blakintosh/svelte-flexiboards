import {
	assistiveTextStyleObject,
	InternalFlexiAddController,
	type FlexiAddClasses,
	type FlexiAddController,
	type FlexiAddWidgetFn,
	type FlexiCommonProps
} from '@flexiboards/core';
import { useCallback, useId, type ReactNode } from 'react';
import { useInternalFlexiBoard } from '../adapters/board.js';
import { FlexiAddContext } from '../adapters/misc.js';
import { controllerRef, useOnce, useSingleRef } from '../adapters/utils.js';
import { RenderedFlexiWidget } from './rendered-flexi-widget.js';
import { useFromCore } from '../adapter.js';

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
	children?: (params: { adder: FlexiAddController }) => ReactNode;

	/**
	 * When the user interacts with the adder, this function allows you to
	 * specify the configuration of the widget that is created and grabbed.
	 * Return null to cancel the add.
	 */
	addWidget: FlexiAddWidgetFn<string>;
};

export function FlexiAdd({ children, className, addWidget, onfirstcreate }: FlexiAddProps) {
	const provider = useInternalFlexiBoard();

	const adder = useSingleRef(() => new InternalFlexiAddController(provider, addWidget));
	useOnce(() => onfirstcreate?.(adder as FlexiAddController));

	const assistiveTextId = useId();

	// useFromCore: the user's class function may read signal-backed adder state.
	const derivedClassName = useFromCore(
		useCallback(() => {
			if(typeof className === 'function') {
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
				onPointerDown={(e) => adder.onpointerdown(e.nativeEvent)}
				onKeyDown={(e) => adder.onkeydown(e.nativeEvent)}
			>
				<span style={assistiveTextStyleObject} id={assistiveTextId}>
					Press Enter to drag a new widget into this board.
				</span>
				{children?.({ adder })}
			</button>

			<div style={{display: 'none'}}>
				{newWidget && (
					<RenderedFlexiWidget widget={newWidget} />
				)}
			</div>
		</FlexiAddContext.Provider>
	);
}
