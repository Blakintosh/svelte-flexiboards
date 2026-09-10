import { FlexiResize, useFlexiWidget } from '@flexiboards/react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '$lib/utils.js';
import { useFlexspressiveEditor } from './editor-context';

export type TileContentsProps = {
	title: string;
	on: boolean;
	onIcon?: LucideIcon;
	offIcon?: LucideIcon;
};

/**
 * State is a fill, never a colour swap: on is ink, off is a tinted card, and the
 * fill survives edit mode so both readings stay legible at once. The tile being
 * edited takes the fx-accent dashed frame; the tile in hand takes the lifted-card
 * look instead, and the placeholder left behind takes the same dashed frame.
 */
export default function TileContents({
	title,
	on: initialOn,
	onIcon: Icon,
	offIcon: OffIcon
}: TileContentsProps) {
	const { editMode } = useFlexspressiveEditor();
	const widget = useFlexiWidget();

	const [on, setOn] = useState(initialOn);
	const [editingTile, setEditingTile] = useState(false);

	const node = useRef<HTMLButtonElement | null>(null);

	// Leaving edit mode drops the tile out of its editing state, whether or not
	// it was the tile being edited.
	useEffect(() => {
		if (editMode) return;

		setEditingTile(false);
		widget.resizability = 'none';
		widget.draggability = 'movable';
	}, [editMode, widget]);

	function onClick() {
		if (!editMode) {
			setOn((value) => !value);
			return;
		}
		if (editingTile) {
			return;
		}

		setEditingTile(true);
		widget.resizability = 'horizontal';
		widget.draggability = 'full';
	}

	useEffect(() => {
		function clickOutsideHandler(event: MouseEvent) {
			if (editingTile && node.current && !node.current.contains(event.target as Node)) {
				setEditingTile(false);
				widget.resizability = 'none';
				widget.draggability = 'movable';
			}
		}

		document.addEventListener('click', clickOutsideHandler, true);
		return () => document.removeEventListener('click', clickOutsideHandler, true);
	}, [editingTile, widget]);

	return (
		<button
			ref={node}
			onClick={onClick}
			className={cn(
				'relative grid h-full w-full cursor-pointer place-items-center justify-items-center rounded-[14px] transition-[color,background-color,border-color,rotate] duration-[120ms] motion-reduce:transition-none',
				on && !editingTile && 'bg-ink text-paper shadow-card',
				!on && !editingTile && 'border border-rule-soft bg-tint text-body shadow-card',
				editingTile &&
					'border-[1.5px] border-dashed border-fx-accent/60 bg-tint-accent text-fx-accent-hover shadow-card',
				widget.isGrabbed && 'border-0 shadow-lift rotate-[2.5deg] bg-panel text-ink',
				widget.isShadow &&
					'border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent text-fx-accent-hover shadow-none'
			)}
		>
			<span className="sr-only">Toggle {title}</span>
			<div
				className={cn(
					widget.width == 2 && 'flex items-center gap-2.5 px-3 w-full',
					widget.width == 1 && 'flex items-center justify-center px-3 w-full',
					'min-w-0'
				)}
			>
				{Icon && (
					<div className="size-[18px] [&>svg]:size-[18px]">
						{on ? <Icon /> : OffIcon ? <OffIcon /> : null}
					</div>
				)}
				{widget.width == 2 && <h4 className="text-[11px] font-semibold truncate">{title}</h4>}
			</div>

			{/* Resize handle when editing tile */}
			{editingTile && (
				<FlexiResize className="absolute top-[50%] right-0 translate-y-[-50%] translate-x-[50%] grid place-items-center p-2 lg:p-0">
					<span className="pointer-events-none block w-1.5 h-4 rounded-full bg-fx-accent"></span>
				</FlexiResize>
			)}
		</button>
	);
}
