import { FlexiGrab } from '@flexiboards/react';
import { cn } from '$lib/utils.js';
import { GripVertical, Play, Pause, Heart } from 'lucide-react';
import Button from '../common/button';
import { formatDuration } from './tracks';
import type { Track } from './tracks';

export type PlaylistRowProps = {
	track: Track;
	position: number;
	isCurrent: boolean;
	playing: boolean;
	liked: boolean;
	onTogglePlay: () => void;
	onToggleLike: () => void;
};

/*
	The row body is ordinary interactive markup. Only the FlexiGrab handle starts a
	drag, so the buttons below stay clickable — that is the point of the example.
*/
export default function PlaylistRow({
	track,
	position,
	isCurrent,
	playing,
	liked,
	onTogglePlay,
	onToggleLike
}: PlaylistRowProps) {
	return (
		<div
			data-track={track.id}
			className={cn(
				'flex h-full w-full items-center gap-2 pr-2',
				isCurrent && 'border-blue bg-tint border-l-2'
			)}
		>
			{/* Vermillion means movement: the handle answers in accent on hover and focus. */}
			<FlexiGrab
				className={cn(
					'text-faint flex h-10 w-8 shrink-0 items-center justify-center rounded-[8px] transition-colors duration-[120ms]',
					'hover:bg-tint-accent hover:text-fx-accent active:bg-tint-accent active:text-fx-accent',
					'focus-visible:outline-fx-accent focus-visible:outline-2 focus-visible:-outline-offset-2'
				)}
			>
				<GripVertical size={16} />
				<span className="sr-only">Reorder {track.title}</span>
			</FlexiGrab>

			{/* The top of the queue is what is playing, so the top row holds the transport. */}
			<div className="flex w-10 shrink-0 items-center justify-center">
				{isCurrent ? (
					<Button
						variant="ghost"
						size="icon"
						className="text-blue hover:text-blue size-8 rounded-full"
						aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
						onClick={onTogglePlay}
					>
						{playing ? <Pause className="size-4" /> : <Play className="size-4" />}
					</Button>
				) : (
					<span className="text-faint font-mono text-[11px] tabular-nums">{position}</span>
				)}
			</div>

			<div className="flex min-w-0 flex-1 items-baseline gap-2">
				<span className="text-ink truncate text-[13px]">{track.title}</span>
				<span className="text-body hidden truncate text-[13px] sm:inline">{track.artist}</span>
			</div>

			<Button
				variant="ghost"
				size="icon"
				className={cn(
					'size-8 shrink-0 rounded-full',
					liked ? 'text-fx-accent hover:bg-tint-accent hover:text-fx-accent' : 'text-faint'
				)}
				aria-pressed={liked}
				aria-label={liked ? `Unlike ${track.title}` : `Like ${track.title}`}
				onClick={onToggleLike}
			>
				<Heart className={cn('size-4', liked && 'fill-current')} />
			</Button>

			<span className="text-faint w-11 shrink-0 text-right font-mono text-[11px] tabular-nums">
				{formatDuration(track.seconds)}
			</span>
		</div>
	);
}
