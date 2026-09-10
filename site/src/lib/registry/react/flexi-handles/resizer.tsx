import { FlexiResize } from '@flexiboards/react';
import { MoveDiagonal2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Resizer({ className, size = 16 }: { className?: string; size?: number }) {
	return (
		<FlexiResize
			className={cn(
				'text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 rounded-md p-1.5 transition-colors',
				className
			)}
		>
			<MoveDiagonal2 size={size} />
		</FlexiResize>
	);
}
