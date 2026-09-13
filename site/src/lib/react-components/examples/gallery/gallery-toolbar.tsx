import { ArrowRightLeft, RotateCcw } from 'lucide-react';
import { cn } from '$lib/utils.js';
import Button from '../common/button';

export type Motion = 'spring' | 'css';

export type GalleryToolbarProps = {
	motion: Motion;
	onMotionChange: (motion: Motion) => void;
	onShuffle: () => void;
	onReset: () => void;
};

const modes: { id: Motion; label: string; hint: string }[] = [
	{ id: 'spring', label: 'Spring', hint: 'Spring motion — springTransitionConfig()' },
	{ id: 'css', label: 'CSS', hint: 'CSS motion — cssTransitionConfig()' }
];

export default function GalleryToolbar({
	motion,
	onMotionChange,
	onShuffle,
	onReset
}: GalleryToolbarProps) {
	return (
		<div className="flex items-center gap-2">
			{/* One mode control: a pill switch, the chosen segment lifts with shadow-seg. */}
			<div
				className="bg-stage flex items-center gap-0.5 rounded-full p-[3px]"
				role="group"
				aria-label="Motion model"
			>
				{modes.map((mode) => (
					<Button
						key={mode.id}
						variant="ghost"
						size="sm"
						className={cn(
							'h-[26px] rounded-full px-2.5 text-xs sm:px-3',
							motion === mode.id ? 'bg-panel shadow-seg text-ink' : 'text-faint hover:text-ink'
						)}
						aria-pressed={motion === mode.id}
						title={mode.hint}
						onClick={() => onMotionChange(mode.id)}
					>
						{mode.label}
					</Button>
				))}
			</div>

			{/* Shuffle keeps an outline pill; Reset is the quiet one beside it. */}
			<Button
				variant="outline"
				size="sm"
				className="border-rule-soft h-8 rounded-full text-xs"
				aria-label="Shuffle the plates"
				onClick={onShuffle}
			>
				<ArrowRightLeft className="size-3.5 sm:hidden" />
				<span className="hidden sm:inline">Shuffle</span>
			</Button>

			<Button
				variant="ghost"
				size="sm"
				className="text-body hover:bg-rule-faint h-8 rounded-full text-xs"
				aria-label="Reset the layout"
				onClick={onReset}
			>
				<RotateCcw className="size-3.5 sm:hidden" />
				<span className="hidden sm:inline">Reset</span>
			</Button>
		</div>
	);
}
