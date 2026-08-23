import type {
	FlexiCommonProps,
	FlexiWidgetClasses,
	FlexiWidgetConfiguration,
	FlexiWidgetController,
	InternalFlexiWidgetController
} from '@flexiboards/core';
import { useEffect, useState } from 'react';
import { useFlexiWidgetInit, type FlexiWidgetChildren } from '../adapters/widget.js';

export type FlexiWidgetProps = FlexiCommonProps<FlexiWidgetController> &
	Omit<FlexiWidgetConfiguration<string>, 'className' | 'snippet'> & {
		/**
		 * The class names to apply to this widget. Either a class value, or a
		 * function deriving one from the widget's state.
		 */
		className?: FlexiWidgetClasses<string>;

		/**
		 * The content rendered within the widget.
		 */
		children?: FlexiWidgetChildren;
	};

/**
 * Registers a widget with the surrounding FlexiTarget. Renders nothing itself —
 * the target renders the created widget via RenderedFlexiWidget.
 */
export function FlexiWidget({
	className,
	children,
	onfirstcreate,
	// controller is a Svelte-bindable with no React equivalent; keep it out of
	// the config forwarded to core.
	controller: _controller,
	...propsConfig
}: FlexiWidgetProps) {
	// The widget is created lazily by the target, so hold the controller in state
	// and let the prop seam below run once it exists. The target always creates
	// internal controllers; updateConfig lives on the internal type.
	const [createdWidget, setCreatedWidget] = useState<InternalFlexiWidgetController | undefined>(
		undefined
	);

	const assembleConfig = (): FlexiWidgetConfiguration<string> => ({
		...propsConfig,
		...(className !== undefined && { className }),
		...(children !== undefined && { snippet: children })
	});

	// Callback so that we still fulfil these props.
	function onWidgetCreated(widget: FlexiWidgetController) {
		setCreatedWidget(widget as InternalFlexiWidgetController);

		onfirstcreate?.(widget);
	}

	useFlexiWidgetInit(assembleConfig(), onWidgetCreated);

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
		createdWidget?.updateConfig(assembleConfig());
	});

	return null;
}
