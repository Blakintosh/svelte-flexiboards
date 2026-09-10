import { useEffect } from 'react';
import { useFlexiWidget } from '@flexiboards/react';
import Grabber from '../common/grabber';

// Status chips: cool tints for the flow, ink for Done, faint for Backlog.
const CHIPS: Record<string, { chip: string; tick: string }> = {
	backlog: { chip: 'bg-tint-2 text-body', tick: 'bg-faint' },
	progress: { chip: 'bg-tint text-blue', tick: 'bg-blue' },
	review: { chip: 'bg-tint text-blue', tick: 'bg-blue' },
	done: { chip: 'bg-tint-2 text-ink', tick: 'bg-ink' }
};

export type KanbanColumnHeadProps = {
	/** Live card count for this column, rendered in the margin beside the chip. */
	count: number;
	/**
	 * Reports the heading's live grid position back to the page, which turns it
	 * into a CSS `order` for the card list below. Svelte read `heads[key].x`
	 * off a bound controller; React has no `bind:`, so the reactive read lives
	 * here — where `useFlexiWidget()` makes it re-render — and travels upward.
	 */
	onPosition: (key: string, x: number | undefined, grabbed: boolean) => void;
};

export default function KanbanColumnHead({ count, onPosition }: KanbanColumnHeadProps) {
	const widget = useFlexiWidget();
	const key = String(widget.metadata?.key ?? '');
	const chip = CHIPS[key] ?? CHIPS.backlog;
	const x = widget.x;
	const grabbed = widget.isGrabbed;

	useEffect(() => {
		onPosition(key, x, grabbed);
	}, [onPosition, key, x, grabbed]);

	return (
		<>
			<Grabber size={14} />
			<span
				className={`flex min-w-0 items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${chip.chip}`}
			>
				{/* The status tick, a small dot. */}
				<span className={`size-2 shrink-0 rounded-full ${chip.tick}`}></span>
				<span className="min-w-0 truncate">{String(widget.metadata?.title ?? '')}</span>
			</span>
			{/* The count hangs in the margin beside the chip, not inside it. */}
			<span className="text-faint shrink-0 font-mono text-[11px]">{count}</span>
		</>
	);
}
