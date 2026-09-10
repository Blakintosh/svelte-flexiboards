import { TrendingUp } from 'lucide-react';

/** Twins of `examples/flexiboard/tiles/*.svelte`. */

function Metric({
	value,
	note,
	accent = false
}: {
	value: string;
	note: string;
	accent?: boolean;
}) {
	const tone = accent ? 'text-fx-accent' : 'text-blue';
	return (
		<div className="flex flex-col gap-2">
			<div className="text-ink font-serif text-[26px] font-semibold tracking-[-0.01em]">
				{value}
			</div>
			<div className="flex items-center gap-1.5">
				<TrendingUp className={`${tone} size-3.5`} />
				<p className={`${tone} text-[12px]`}>{note}</p>
			</div>
		</div>
	);
}

// The Domine value is the headline; a rise reads blue — fx-accent is kept for
// the one metric that needs attention.
export function MrrTile() {
	return <Metric value="$45,231" note="+20.1% MoM" />;
}

export function SubscriptionsTile() {
	return <Metric value="2,350" note="+180 this month" />;
}

// The one fx-accent metric on the sheet: churn rising is the thing to notice.
export function ChurnTile() {
	return <Metric value="2.1%" note="+0.3 pt" accent />;
}

// Six monthly readings, drawn as rounded bars: the drafting-blue ramp climbs
// toward the latest reading, which takes the accent as the one live value.
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const points = [135, 98, 118, 104, 52, 38];
const heights = points.map((y) => ((170 - y) / 170) * 100);

function barClass(index: number, isLast: boolean) {
	if (isLast) return 'bg-fx-accent';
	if (index < 2) return 'bg-[var(--chart-4)]';
	if (index < 4) return 'bg-[var(--chart-3)]';
	return 'bg-[var(--chart-2)]';
}

export function RevenueTile() {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mt-2 flex min-h-16 flex-1 items-end gap-1.5 lg:gap-2">
				{heights.map((height, i) => (
					<div
						key={months[i]}
						className={`min-w-0 flex-1 rounded-t-[8px] ${barClass(i, i === heights.length - 1)}`}
						style={{ height: `${height}%` }}
					></div>
				))}
			</div>
			<div className="mt-1.5 flex justify-between">
				{months.map((month, i) => (
					<span
						key={month}
						className={`font-mono text-[10px] ${
							i === months.length - 1 ? 'text-fx-accent font-semibold' : 'text-faint'
						}`}
					>
						{month}
					</span>
				))}
			</div>
		</div>
	);
}

// A slow ease rather than the terminal caret's hard steps() — this is a
// heartbeat, not a cursor. Stilled under reduced motion.
const liveDotCss = `
@media (prefers-reduced-motion: no-preference) {
	.live-dot { animation: live-dot 1.6s ease-in-out infinite; }
}
@keyframes live-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
`;

export function ActiveTile() {
	return (
		<div className="flex flex-col gap-2">
			<style>{liveDotCss}</style>
			<div className="flex items-center gap-2.5">
				<span className="text-ink font-serif text-[26px] font-semibold tracking-[-0.01em]">
					573
				</span>
				{/* The permitted loop on this sheet: a dot marking a live count. */}
				<span className="live-dot bg-fx-accent block size-2 rounded-full"></span>
			</div>
			<div className="flex items-center gap-1.5">
				<TrendingUp className="text-blue size-3.5" />
				<p className="text-blue text-[12px]">+201 / hr</p>
			</div>
		</div>
	);
}
