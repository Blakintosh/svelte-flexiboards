import { FlexiGrab } from '@flexiboards/react';
import { cn } from '$lib/utils.js';
import { GripVertical } from 'lucide-react';

type GrabberProps = {
	className?: string;
	size?: number;
};

/** Vermillion means movement: the grab handle turns accent the moment it is touched. */
export default function Grabber({ className, size = 20 }: GrabberProps) {
	return (
		<FlexiGrab
			className={cn(
				'text-faint hover:bg-tint hover:text-fx-accent active:bg-tint-accent active:text-fx-accent shrink-0 rounded-[7px] p-1.5 transition-colors duration-[120ms]',
				className
			)}
		>
			<GripVertical size={size} />
		</FlexiGrab>
	);
}
