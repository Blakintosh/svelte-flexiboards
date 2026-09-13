import { FlexiWidget, simpleTransitionConfig } from '@flexiboards/react';
import type { FlexiWidgetController } from '@flexiboards/react';
import type { ComponentType } from 'react';
import { cn } from '$lib/utils.js';
import Grabber from '../common/grabber';

type FlexionBlockContainerProps = {
	component?: ComponentType<Record<string, never>>;
	// Content for the block component; blocks are otherwise identical shells.
	props?: Record<string, unknown>;
};

// Module-level so the widget's prop seam sees the same values every render.
const blockClass = (widget: FlexiWidgetController) =>
	cn(
		'group flex w-full min-w-0 items-start gap-4 rounded-[10px] px-2 py-1 transition-colors duration-[120ms] motion-reduce:transition-none hover:bg-rule-faint',
		widget.isGrabbed && ' bg-panel opacity-60 shadow-lift',
		widget.isShadow &&
			'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent'
	);

const blockTransition = simpleTransitionConfig();

export default function FlexionBlockContainer({
	component: Component,
	props = {}
}: FlexionBlockContainerProps) {
	return (
		<FlexiWidget className={blockClass} transition={blockTransition}>
			<Grabber size={16} className="shrink-0 py-1 group-hover:opacity-100 lg:opacity-0" />

			<div className="w-full min-w-0 grow">
				{Component && <Component {...(props as Record<string, never>)} />}
			</div>

			{/* The affordance teaches itself on hover; no tooltip, no persistent chrome. */}
			<span className="text-fx-accent ml-auto hidden shrink-0 self-start pt-1.5 text-[11px] font-semibold opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 motion-reduce:transition-none lg:block">
				Grab to reorder
			</span>
		</FlexiWidget>
	);
}
