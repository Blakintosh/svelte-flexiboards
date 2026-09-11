'use client';
import { FlexiDashboard, type FlexiDashboardProps } from '@flexiboards/react';
import { cn } from '@/lib/utils';
export type RootProps = FlexiDashboardProps;
export function Root({ className, targetConfig, resizable = true, ...props }: RootProps) {
	return (
		<FlexiDashboard
			{...props}
			resizable={resizable}
			className={cn('gap-4', className)}
			targetConfig={{ rowSizing: '160px', ...targetConfig }}
		/>
	);
}
