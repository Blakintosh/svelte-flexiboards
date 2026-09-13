import { CloudSun } from 'lucide-react';

/** 2 × 1. */
export default function LauncherWeatherTile() {
	return (
		<div className="flex h-full w-full items-center gap-2.5 overflow-hidden px-2.5">
			<CloudSun className="text-blue size-6 shrink-0 lg:size-7" />
			<div className="flex min-w-0 flex-col">
				<span className="text-ink font-mono text-xl tabular-nums">17°</span>
				<span className="text-faint truncate text-[10px] font-semibold">Part cloudy</span>
			</div>
		</div>
	);
}
