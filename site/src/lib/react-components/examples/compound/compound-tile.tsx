import Grabber from '../common/grabber';
import MetricTile, { type MetricTileProps } from './metric-tile';
import LatencyTile, { type LatencyTileProps } from './latency-tile';
import TeamBoard from './team-board';
import TasksBoard from './tasks-board';

export type TileKind = 'deploys' | 'errors' | 'uptime' | 'team' | 'tasks' | 'latency';
export type MetricKind = 'deploys' | 'errors' | 'uptime';

export type CompoundTileProps = {
	kind: TileKind;
	onCommit: (scope: 'compound' | 'team' | 'tasks') => void;
};

/** Title, and — for the two tiles that are themselves boards — the board's name. */
const info: Record<TileKind, { title: string; board?: string }> = {
	deploys: { title: 'Deploys' },
	errors: { title: 'Error rate' },
	uptime: { title: 'Uptime 30d' },
	team: { title: 'On-call rotation', board: 'board.team' },
	tasks: { title: 'Release queue', board: 'board.tasks' },
	latency: { title: 'P95 latency' }
};

const metrics: Record<MetricKind, MetricTileProps> = {
	deploys: {
		value: '18',
		delta: '+4 vs yesterday',
		positive: true,
		bars: [22, 34, 48, 66, 80, 100]
	},
	errors: {
		value: '0.42%',
		delta: '−0.08 pts',
		positive: true,
		bars: [100, 84, 66, 48, 34, 26]
	},
	uptime: {
		value: '99.98%',
		delta: '0 incidents',
		positive: false,
		bars: [96, 100, 98, 100, 100, 99]
	}
};

const latency: LatencyTileProps = {
	value: '214 ms',
	series: [
		{ at: '00:00', pct: 62 },
		{ at: '04:00', pct: 48 },
		{ at: '08:00', pct: 96 },
		{ at: '12:00', pct: 71 },
		{ at: '16:00', pct: 84 }
	]
};

export default function CompoundTile({ kind, onCommit }: CompoundTileProps) {
	const tile = info[kind];

	return (
		<div
			className="border-rule-soft bg-panel shadow-card flex h-full w-full min-w-0 flex-col gap-0 rounded-[14px] border"
			data-tile-kind={kind}
		>
			{/*
				The handle is the only way to move a tile, and it is always visible rather
				than hover-revealed. Because the tile has a grabber, the library suppresses
				direct grabs on the tile body — which is exactly what lets the inner boards
				be drag-anywhere.
			*/}
			<div className="border-rule-faint flex shrink-0 items-center gap-1 border-b px-2 py-1.5 lg:px-2.5">
				<Grabber size={16} className="-ml-0.5 p-1 lg:p-1.5 [&_svg]:size-4 lg:[&_svg]:size-5" />
				<span className="text-faint min-w-0 flex-1 truncate text-[11px] font-semibold lg:text-[11.5px]">
					{tile.title}
				</span>
				{tile.board && (
					<span className="label border-rule-soft text-faint hidden w-fit shrink-0 items-center justify-center overflow-hidden rounded-full border px-2 py-[3px] text-[10px] tracking-[0.1em] whitespace-nowrap sm:inline-flex">
						{tile.board}
					</span>
				)}
			</div>

			<div className="min-h-0 min-w-0 flex-1 px-2 py-2 lg:px-3">
				{kind === 'team' ? (
					<TeamBoard onCommit={onCommit} />
				) : kind === 'tasks' ? (
					<TasksBoard onCommit={onCommit} />
				) : kind === 'latency' ? (
					<LatencyTile value={latency.value} series={latency.series} />
				) : (
					<MetricTile {...metrics[kind]} />
				)}
			</div>
		</div>
	);
}
