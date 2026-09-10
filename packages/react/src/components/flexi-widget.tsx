import type {
	FlexiWidgetClasses,
	FlexiWidgetConfiguration as CoreFlexiWidgetConfiguration,
	FlexiWidgetController,
	InternalFlexiWidgetController
} from '@flexiboards/core';
import type { FlexiWidgetConfiguration } from '../types.js';
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFlexiWidgetInit, type FlexiWidgetChildren } from '../adapters/widget.js';
import type { FlexiCommonProps } from '../adapters/utils.js';

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
 * Registers a widget with the surrounding FlexiTarget. Renders nothing itself —
 * the target renders the created widget via RenderedFlexiWidget.
 */
export function FlexiWidget({
	className,
	children,
	onfirstcreate,
	...propsConfig
}: FlexiWidgetProps) {
	// The widget is created lazily by the target — during the target loader's
	// render, in the same pass as this component — so the controller lives in a
	// ref (a state write from inside another component's render is illegal) and
	// the effects below pick it up after commit. The target always creates
	// internal controllers; updateConfig lives on the internal type.
	const createdWidget = useRef<InternalFlexiWidgetController | undefined>(undefined);
	const firstCreateFired = useRef(false);

	const assembleConfig = (): CoreFlexiWidgetConfiguration<string> => ({
		...propsConfig,
		...(className !== undefined && { className }),
		// Plain nodes become a constant snippet; functions get the widget + events.
		...(children !== undefined && {
			snippet: typeof children === 'function' ? children : () => children
		})
	});

	useFlexiWidgetInit(assembleConfig(), (widget) => {
		createdWidget.current = widget as InternalFlexiWidgetController;
	});

	// onfirstcreate fires once the widget exists, from a layout effect (like the
	// other components' useOnceCommitted), so the consumer may set state in it.
	useLayoutEffect(() => {
		if (firstCreateFired.current || !createdWidget.current) return;
		firstCreateFired.current = true;
		onfirstcreate?.(createdWidget.current);
	});

	// Prop seam — see FlexiBoard. updateConfig() merges only the keys that
	// actually changed, so it never clobbers state set imperatively on the
	// controller and writes nothing when a key is unchanged.
	//
	// Deliberately NO dependency array: unlike Svelte (where snippets and inline
	// functions are stable consts because a component's setup runs once), React
	// rebuilds `children` and inline class functions on every parent render —
	// each render's values are genuinely the current content, so the seam must
	// observe every render. Identity-changed keys (like a fresh children tree)
	// being re-written each time is the semantically correct React behaviour.
	useEffect(() => {
		createdWidget.current?.updateConfig(assembleConfig());
	});

	return null;
}
