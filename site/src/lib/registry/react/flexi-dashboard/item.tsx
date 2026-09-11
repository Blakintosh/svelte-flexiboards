'use client';
import { FlexiWidget, type FlexiWidgetProps } from '@flexiboards/react';
import { cn } from '@/lib/utils';
export type ItemProps = FlexiWidgetProps;
export function Item({ className, ...props }: ItemProps) {
	return (
		<FlexiWidget
			{...props}
			className={(widget) =>
				cn(
					'bg-card text-card-foreground border-border relative flex min-h-0 min-w-0 flex-col rounded-xl border shadow-sm',
					widget.isShadow && 'border-dashed opacity-50',
					widget.isGrabbed && 'ring-ring shadow-lg ring-2',
					typeof className === 'function' ? className(widget) : className
				)
			}
		/>
	);
}
