import { cn } from '$lib/utils.js';

/**
 * The three boards on this page. Every drop the library reports belongs to
 * exactly one of them — which is the claim the log exists to make falsifiable.
 */
export type DropScope = 'compound' | 'team' | 'tasks';
export type DropCounts = Record<DropScope, number>;

export type DropLogProps = {
	drops: DropCounts;
	flashed: DropScope | null;
};

const boards: { scope: DropScope; name: string; geometry: string }[] = [
	{ scope: 'compound', name: 'board.compound', geometry: 'free · 3 × 4' },
	{ scope: 'team', name: 'board.team', geometry: 'flow · 1 × 6' },
	{ scope: 'tasks', name: 'board.tasks', geometry: 'flow · n × 1' }
];

/** Footer band of the sheet: one line per board, so the log reads as a legend. */
export default function DropLog({ drops, flashed }: DropLogProps) {
	return (
		<ul className="grid w-full grid-cols-3 gap-2">
			{boards.map((board) => (
				// The board that just took a drop is provisional state, so it answers in fx-accent.
				<li
					key={board.scope}
					aria-live="polite"
					className={cn(
						'border-rule-soft bg-tint-2 flex min-w-0 items-baseline justify-between gap-2 rounded-[10px] border px-2.5 py-1.5 transition-colors duration-[120ms] lg:px-3',
						flashed === board.scope && 'border-fx-accent/40 bg-tint-accent'
					)}
				>
					<span
						className={cn(
							'truncate font-mono text-[10px] lg:text-[11px]',
							flashed === board.scope ? 'text-fx-accent-hover' : 'text-ink'
						)}
					>
						{board.name}
					</span>
					<span
						className={cn(
							'shrink-0 font-mono text-[9px] lg:text-[10px]',
							flashed === board.scope ? 'text-fx-accent-hover' : 'text-faint'
						)}
					>
						<span className="hidden sm:inline">{board.geometry} · </span>drops {drops[board.scope]}
					</span>
				</li>
			))}
		</ul>
	);
}
