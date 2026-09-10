import { FlexiGrab } from '@flexiboards/react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Grabber({ className, size = 16 }: { className?: string; size?: number }) {
	return (
		<FlexiGrab
			className={cn(
				'text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 rounded-md p-1.5 transition-colors',
				className
			)}
		>
			<GripVertical size={size} />
		</FlexiGrab>
	);
}
