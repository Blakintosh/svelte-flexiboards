/** 2 × 1. Static by design: no timer to schedule, clean up, or make renders non-deterministic. */
export default function LauncherClockTile() {
	return (
		<div className="flex h-full w-full flex-col justify-center overflow-hidden px-3">
			<span className="text-ink font-mono text-2xl tabular-nums lg:text-3xl">9:41</span>
			<span className="text-faint truncate text-[10px] font-semibold">Tue 19 Jul</span>
		</div>
	);
}
