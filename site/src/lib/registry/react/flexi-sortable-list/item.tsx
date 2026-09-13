'use client';
import { FlexiWidget, type FlexiWidgetProps } from '@flexiboards/react';
import { cn } from '@/lib/utils';
export type ItemProps = FlexiWidgetProps & { id: string };
export function Item({ className, id, metadata, ...props }: ItemProps) {
	return (
		<FlexiWidget
			{...props}
			id={id}
			metadata={{ ...metadata, id }}
			className={(widget) =>
				cn(
					'bg-card text-card-foreground border-border relative flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm',
					widget.isShadow && 'border-dashed opacity-50',
					widget.isGrabbed && 'ring-ring shadow-lg ring-2',
					typeof className === 'function' ? className(widget) : className
				)
			}
		/>
	);
}
