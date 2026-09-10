import { cn } from '$lib/utils.js';

export type MetricTileProps = {
	value: string;
	delta: string;
	positive?: boolean;
	/** Six values, 0–100, drawn as a bar strip. Divs, not a chart library. */
	bars: number[];
};

export default function MetricTile({ value, delta, positive = false, bars }: MetricTileProps) {
	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col justify-center gap-0.5">
			<div className="flex min-w-0 items-end justify-between gap-2">
				<span className="text-ink truncate font-serif text-xl font-semibold tracking-[-0.01em] lg:text-3xl">
					{value}
				</span>
				{/* Sparkline: drafting blue on a tint track, the latest reading in fx-accent. */}
				<div className="hidden h-8 shrink-0 items-end gap-[3px] lg:flex" aria-hidden="true">
					{bars.map((bar, i) => (
						<div
							key={i}
							className="bg-tint flex h-full w-[5px] items-end overflow-hidden rounded-t-[3px]"
						>
							<div
								className={cn('w-full', i === bars.length - 1 ? 'bg-fx-accent' : 'bg-blue')}
								style={{ height: `${bar}%` }}
							/>
						</div>
					))}
				</div>
			</div>
			<span
				className={cn('truncate text-[11px] lg:text-[12px]', positive ? 'text-blue' : 'text-faint')}
			>
				{delta}
			</span>
		</div>
	);
}
