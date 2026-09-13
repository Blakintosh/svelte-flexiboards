import { FlexiResize } from '@flexiboards/react';
import { cn } from '$lib/utils.js';
import { MoveDiagonal2 } from 'lucide-react';

type ResizerProps = {
	className?: string;
	size?: number;
};

/** Resizing is movement too, so the handle answers in fx-accent rather than a shadowed pill. */
export default function Resizer({ className, size = 20 }: ResizerProps) {
	return (
		<FlexiResize
			className={cn(
				'text-faint hover:bg-tint hover:text-fx-accent active:bg-tint-accent active:text-fx-accent shrink-0 rounded-[7px] p-1.5 transition-colors duration-[120ms]',
				className
			)}
		>
			<MoveDiagonal2 size={size} />
		</FlexiResize>
	);
}
