'use client';
import { FlexiBoard, type FlexiBoardProps } from '@flexiboards/react';
import { cn } from '@/lib/utils';
import { useReducedMotion, withMotion } from '../flexi-motion';
export type RootProps = FlexiBoardProps;
export function Root({ className, config, ...props }: RootProps) {
	const motionConfig = withMotion(config, useReducedMotion());
	return (
		<FlexiBoard
			{...props}
			className={cn('text-foreground', className)}
			config={{
				...motionConfig,
				widgetDefaults: { draggability: 'full', ...motionConfig.widgetDefaults }
			}}
		/>
	);
}
