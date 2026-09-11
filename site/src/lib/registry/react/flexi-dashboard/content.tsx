import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Content({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			{...props}
			data-slot="dashboard-content"
			className={cn('min-h-0 flex-1 overflow-auto p-4', className)}
		/>
	);
}
