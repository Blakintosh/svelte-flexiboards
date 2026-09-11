'use client';

import type { ComponentProps } from 'react';
import { FlexiGrab } from '@flexiboards/react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GrabberProps = ComponentProps<typeof FlexiGrab> & { size?: number; label?: string };

export function Grabber({ className, children, size = 16, label = 'Move widget' }: GrabberProps) {
	return (
		<FlexiGrab
			className={(widget) =>
				cn(
					'text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring ring-offset-background inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
					typeof className === 'function' ? className(widget) : className
				)
			}
		>
			{(context) => (
				<>
					<span className="sr-only">{label}</span>
					{children ? (
						typeof children === 'function' ? (
							children(context)
						) : (
							children
						)
					) : (
						<GripVertical size={size} aria-hidden="true" />
					)}
				</>
			)}
		</FlexiGrab>
	);
}
