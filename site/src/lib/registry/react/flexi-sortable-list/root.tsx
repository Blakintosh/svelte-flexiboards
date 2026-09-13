'use client';
import { useMemo } from 'react';
import {
	FlexiSortable,
	type FlexiSortableProps,
	type FlexiBoardConfiguration
} from '@flexiboards/react';
import { cn } from '@/lib/utils';
import { useReducedMotion, withMotion } from '../flexi-motion';
export type RootProps = FlexiSortableProps & { onReorder?: (ids: string[]) => void };
export function Root({
	className,
	config,
	keyName = 'list',
	direction = 'vertical',
	onReorder,
	...props
}: RootProps) {
	const reducedMotion = useReducedMotion();
	const boardConfig = useMemo<FlexiBoardConfiguration>(
		() => ({
			...withMotion(config, reducedMotion),
			onLayoutChange: (layout) => {
				config?.onLayoutChange?.(layout);
				onReorder?.(
					[...(layout[keyName] ?? [])]
						.sort((a, b) =>
							direction === 'vertical' ? (a.y ?? 0) - (b.y ?? 0) : (a.x ?? 0) - (b.x ?? 0)
						)
						.flatMap((entry) => (typeof entry.metadata?.id === 'string' ? [entry.metadata.id] : []))
				);
			}
		}),
		[config, keyName, direction, onReorder, reducedMotion]
	);
	return (
		<FlexiSortable
			{...props}
			keyName={keyName}
			direction={direction}
			className={cn('gap-2', className)}
			config={boardConfig}
		/>
	);
}
