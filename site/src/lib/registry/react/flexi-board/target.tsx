'use client';
import { FlexiTarget, type FlexiTargetProps } from '@flexiboards/react';
import { cn } from '@/lib/utils';
export function Target({ className, containerClassName, ...props }: FlexiTargetProps) {
	return (
		<FlexiTarget
			{...props}
			className={cn('min-h-24 gap-3', className)}
			containerClassName={cn('bg-muted/40 border-border rounded-xl border p-3', containerClassName)}
		/>
	);
}
