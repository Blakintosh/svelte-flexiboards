import { useFlexiWidget } from '@flexiboards/react';
import { cn } from '$lib/utils.js';

export type TeamMember = {
	initials: string;
	name: string;
	role: string;
};

export type TeamAvatarProps = {
	member: TeamMember;
};

export default function TeamAvatar({ member }: TeamAvatarProps) {
	// The widget's own position in the flow target is the roster order — read live,
	// so it renumbers the moment a drop lands.
	const widget = useFlexiWidget();
	const position = widget.x + 1;
	const onCall = position === 1;

	return (
		<div
			className="relative flex h-full w-full cursor-grab items-center justify-center"
			title={`${member.name} — ${member.role}`}
		>
			{/* No portraits in the examples: the avatar is the initials on a tint chip. */}
			<span
				aria-hidden="true"
				className="border-rule-soft bg-tint text-blue flex size-full items-center justify-center overflow-hidden rounded-[9px] border text-[11px] font-bold"
			>
				{member.initials}
			</span>
			{/* Position 1 is on call now: the roster's one status, so it takes the accent. */}
			<span
				aria-hidden="true"
				className={cn(
					'pointer-events-none absolute top-px right-0.5 font-mono text-[9px] leading-none',
					onCall ? 'text-fx-accent' : 'text-faint'
				)}
			>
				{position}
			</span>
			<span className="sr-only">
				{member.name}, {member.role}, rotation position {position}
				{onCall ? ', on call now' : ''}
			</span>
		</div>
	);
}
