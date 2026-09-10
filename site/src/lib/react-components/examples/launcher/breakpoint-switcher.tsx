import { cn } from '$lib/utils.js';
import Button from '../common/button';
import { BREAKPOINTS } from './layouts';
import type { Pin } from './layouts';

export type BreakpointSwitcherProps = {
	value: Pin;
	onChange: (pin: Pin) => void;
};

const options: { id: Pin; label: string; title: string }[] = [
	{ id: 'auto', label: 'Auto', title: 'Follow the viewport width' },
	{ id: 'lg', label: 'LG', title: `Pin the lg layout (${BREAKPOINTS.lg.threshold})` },
	{ id: 'md', label: 'MD', title: `Pin the md layout (${BREAKPOINTS.md.threshold})` },
	{ id: 'sm', label: 'SM', title: `Pin the sm layout (${BREAKPOINTS.sm.threshold})` }
];

/*
	One pill row on a recessed stage ground: the active segment lifts to a panel
	chip. No eyebrow — "Auto / LG / MD / SM" reads as a breakpoint control on its
	own.
*/
export default function BreakpointSwitcher({ value, onChange }: BreakpointSwitcherProps) {
	return (
		<div
			className="bg-stage flex items-center gap-0.5 rounded-full p-[3px]"
			role="group"
			aria-label="Breakpoint"
		>
			{options.map((option) => (
				<Button
					key={option.id}
					variant="ghost"
					size="sm"
					className={cn(
						'h-7 rounded-full px-3 text-xs font-semibold transition-colors duration-[120ms]',
						value === option.id
							? 'bg-panel shadow-seg text-ink hover:bg-panel'
							: 'text-faint hover:text-ink bg-transparent hover:bg-transparent'
					)}
					title={option.title}
					aria-pressed={value === option.id}
					onClick={() => onChange(option.id)}
				>
					{option.label}
				</Button>
			))}
		</div>
	);
}
