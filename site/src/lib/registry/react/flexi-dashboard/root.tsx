'use client';
import { FlexiDashboard, type FlexiDashboardProps } from '@flexiboards/react';
import { cn } from '@/lib/utils';
import { useReducedMotion, withMotion } from '../flexi-motion';
export type RootProps = FlexiDashboardProps;
export function Root({ className, config, targetConfig, resizable = true, ...props }: RootProps) {
	const motionConfig = withMotion(config, useReducedMotion());
	return (
		<FlexiDashboard
			{...props}
			config={motionConfig}
			resizable={resizable}
			className={cn('gap-4', className)}
			targetConfig={{ rowSizing: '160px', ...targetConfig }}
		/>
	);
}
