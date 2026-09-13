import type {
	FlexiWidgetClasses,
	FlexiWidgetConfiguration as CoreFlexiWidgetConfiguration,
	FlexiWidgetController,
	InternalFlexiWidgetController
} from '@flexiboards/core';
import type { FlexiWidgetConfiguration } from '../types.js';
import { useEffect, useRef, type ReactNode } from 'react';
import { useFlexiWidgetInit, type FlexiWidgetChildren } from '../adapters/widget.js';
import { useClientLayoutEffect, type FlexiCommonProps } from '../adapters/utils.js';

export type FlexiWidgetProps = FlexiCommonProps<FlexiWidgetController> &
	Omit<FlexiWidgetConfiguration, 'className' | 'snippet'> & {
		/**
		 * The class names to apply to this widget. Either a class value, or a
		 * function deriving one from the widget's state.
		 */
		className?: FlexiWidgetClasses<string>;

		/**
		 * The content rendered within the widget.
		 */
		children?: ReactNode | FlexiWidgetChildren;
	};

/**
 * Registers a widget with the surrounding FlexiTarget. Renders nothing itself;
 * the target renders the created widget via RenderedFlexiWidget.
 */
export function FlexiWidget({
	className,
	children,
	onfirstcreate,
	...propsConfig
}: FlexiWidgetProps) {
	// The target creates the widget during the target loader's render, in this
	// same pass, so the controller lives in a ref: a state write from inside
	// another component's render is illegal. The effects below pick it up after
	// commit. The target always creates internal controllers, and updateConfig
	// lives on the internal type.
	const createdWidget = useRef<InternalFlexiWidgetController | undefined>(undefined);
	const firstCreateFired = useRef(false);

	const assembleConfig = (): CoreFlexiWidgetConfiguration<string> => ({
		...propsConfig,
		...(className !== undefined && { className }),
		// Plain nodes become a constant snippet. Functions receive the widget and
		// its events.
		...(children !== undefined && {
			snippet: typeof children === 'function' ? children : () => children
		})
	});

	useFlexiWidgetInit(assembleConfig(), (widget) => {
		createdWidget.current = widget as InternalFlexiWidgetController;
	});

	// Fire after the widget commits so onfirstcreate may set React state.
	useClientLayoutEffect(() => {
		if (firstCreateFired.current || !createdWidget.current) return;
		firstCreateFired.current = true;
		onfirstcreate?.(createdWidget.current);
	});

	// Prop seam, see FlexiBoard. updateConfig() merges only the keys that
	// changed, so it never clobbers state set imperatively on the controller.
	//
	// No dependency array on purpose. Svelte's snippets and inline functions are
	// stable because a component's setup runs once, but React rebuilds
	// `children` and inline class functions on every parent render. Each
	// render's values are the current content, so the seam must observe every
	// render and re-write identity-changed keys such as a fresh children tree.
	useEffect(() => {
		createdWidget.current?.updateConfig(assembleConfig());
	});

	return null;
}
