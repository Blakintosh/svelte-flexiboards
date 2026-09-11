import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Header({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			{...props}
			data-slot="dashboard-header"
			className={cn('flex items-center justify-between gap-3 px-4 pt-4', className)}
		/>
	);
}
