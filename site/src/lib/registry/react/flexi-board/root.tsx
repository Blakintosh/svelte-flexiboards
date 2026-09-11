'use client';
import { FlexiBoard, type FlexiBoardProps } from '@flexiboards/react';
import { cn } from '@/lib/utils';
export type RootProps = FlexiBoardProps;
export function Root({ className, config, ...props }: RootProps) {
	return (
		<FlexiBoard
			{...props}
			className={cn('text-foreground', className)}
			config={{ ...config, widgetDefaults: { draggability: 'full', ...config?.widgetDefaults } }}
		/>
	);
}
