export type LatencyPoint = { at: string; pct: number };

export type LatencyTileProps = {
	value: string;
	series: LatencyPoint[];
};

export default function LatencyTile({ value, series }: LatencyTileProps) {
	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
			<span className="text-ink truncate font-serif text-xl font-semibold tracking-[-0.01em] lg:text-3xl">
				{value}
			</span>
			{/* A chart, unmistakably: it can never be confused with the two draggable lists beside it. */}
			<ul className="flex min-h-0 flex-1 flex-col justify-center gap-1.5">
				{series.map((point) => (
					<li key={point.at} className="flex items-center gap-1.5">
						<span className="text-faint w-8 shrink-0 font-mono text-[9px] lg:text-[10px]">
							{point.at}
						</span>
						<span className="bg-tint h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
							<span
								className="bg-blue block h-full rounded-full"
								style={{ width: `${point.pct}%` }}
							/>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
