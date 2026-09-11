'use client';

import type { ComponentProps } from 'react';
import { FlexiResize } from '@flexiboards/react';
import { MoveDiagonal2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ResizerProps = ComponentProps<typeof FlexiResize> & { size?: number; label?: string };

export function Resizer({ className, children, size = 16, label = 'Resize widget' }: ResizerProps) {
	return (
		<FlexiResize
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
						<MoveDiagonal2 size={size} aria-hidden="true" />
					)}
				</>
			)}
		</FlexiResize>
	);
}
