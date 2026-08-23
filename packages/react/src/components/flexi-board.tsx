import {
	assistiveTextStyleObject,
	boardEvents,
	InternalFlexiBoardController,
	type FlexiBoardController,
	type FlexiBoardProps as FlexiBoardPropsPrimitive
} from '@flexiboards/core';
import { useCallback, useEffect, useId, type ReactNode } from 'react';
import { FlexiBoardContext } from '../adapters/board.js';
import { useInternalResponsiveFlexiBoardOrNull } from '../adapters/responsive.js';
import { controllerRef, useOnce, useSingleRef } from '../adapters/utils.js';
import { parseStyleString, useFromCore } from '../adapter.js';
import { FlexiEventBusProvider } from './flexi-event-bus-provider.js';
import { FlexiAnnouncer } from './flexi-announcer.js';
import { FlexiLayoutLoader } from './flexi-layout-loader.js';
import { FlexiPortal } from './flexi-portal.js';

export type FlexiBoardProps = Omit<FlexiBoardPropsPrimitive<string>, 'class'> & {
	/**
	 * The child content of the board, which should contain the inner
	 * FlexiTarget and FlexiWidget components.
	 */
	children?: ReactNode;

	/**
	 * The class names to apply to the board's root element.
	 */
	className?: string;
};

export function FlexiBoard({ children, className, config, onfirstcreate }: FlexiBoardProps) {
	// A board nested under a ResponsiveFlexiBoard registers against it.
	const responsiveParent = useInternalResponsiveFlexiBoardOrNull();

	const board = useSingleRef(
		() => new InternalFlexiBoardController({ config }, responsiveParent)
	);

	useOnce(() => onfirstcreate?.(board as FlexiBoardController));

	// boardEvents attaches window listeners and returns its cleanup.
	useEffect(() => boardEvents(board), [board]);

	// Prop seam — push config changes into core. updateProps() is inert unless
	// `config` actually changed.
	useEffect(() => {
		board.updateProps({ config });
	}, [board, config]);

	const assistiveTextId = useId();

	const styleString = useFromCore(useCallback(() => board.style, [board]));

	return (
		<FlexiEventBusProvider>
			<FlexiBoardContext.Provider value={board}>
				<div
					className={className}
					ref={controllerRef(board)}
					style={parseStyleString(styleString)}
					role="application"
					aria-label="Interactive drag-and-drop interface"
					aria-describedby={assistiveTextId}
				>
					<span style={assistiveTextStyleObject} id={assistiveTextId}>
						Press Enter to grab or resize widgets. Once grabbed, use Arrow keys to move/resize the
						widget, Enter to confirm the action, or Esc to cancel it.
					</span>
					{children}

					<FlexiAnnouncer provider={board} />
				</div>

				{/* Tells the board it can start importing layouts, if needed. */}
				<FlexiLayoutLoader />

				{/* Shared portal for rendering grabbed widgets over the pointer. */}
				<FlexiPortal />
			</FlexiBoardContext.Provider>
		</FlexiEventBusProvider>
	);
}
