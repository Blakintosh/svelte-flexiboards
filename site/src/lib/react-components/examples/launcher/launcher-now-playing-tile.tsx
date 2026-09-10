import { Music, SkipBack, Play, SkipForward } from 'lucide-react';

/*
	2 × 2, the one feature tile. The transport glyphs are decorative: no hover, no
	cursor change, no handler — the whole tile is a grab target and nothing here
	should read as a second thing to click.
*/
export default function LauncherNowPlayingTile() {
	return (
		<div className="flex h-full w-full flex-col gap-2 overflow-hidden p-3">
			<div className="border-rule-soft bg-tint grid min-h-0 flex-1 place-items-center rounded-[9px] border">
				<Music className="text-blue size-6" />
			</div>
			<div className="flex min-w-0 flex-col">
				<span className="text-ink truncate text-[12px]">Nightwork</span>
				<span className="text-faint truncate text-[10px] font-semibold">Hot Chip</span>
			</div>
			<div className="bg-rule-faint h-1 w-full rounded-full">
				<div className="bg-ink h-full w-[38%] rounded-full"></div>
			</div>
			<div className="text-faint flex items-center justify-center gap-4" aria-hidden="true">
				<SkipBack className="size-4" />
				<Play className="size-4" />
				<SkipForward className="size-4" />
			</div>
		</div>
	);
}
