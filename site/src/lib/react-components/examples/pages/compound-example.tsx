import { FlexiBoard, FlexiTarget, FlexiWidget, cssTransitionConfig, immediateTriggerConfig } from '@flexiboards/react';
import type { FlexiBoardConfiguration, FlexiWidgetController } from '@flexiboards/react';
import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '$lib/utils.js';
import Button from '../common/button';
import Sheet from '../common/sheet';
import CompoundTile, { type TileKind } from '../compound/compound-tile';
import DropLog, { type DropCounts, type DropScope } from '../compound/drop-log';

// The drop preview reads as a dashed placeholder; the tile in hand lifts
// off the stage instead of taking an accent outline.
const tileClass = (widget: FlexiWidgetController) =>
	cn(
		'min-w-0 motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
		widget.isShadow && 'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'shadow-lift rotate-[2.5deg] rounded-[14px]'
	);

const tiles: { kind: TileKind; x: number; y: number; width: number; height: number }[] = [
	{ kind: 'deploys', x: 0, y: 0, width: 1, height: 1 },
	{ kind: 'errors', x: 1, y: 0, width: 1, height: 1 },
	{ kind: 'uptime', x: 2, y: 0, width: 1, height: 1 },
	{ kind: 'team', x: 0, y: 1, width: 3, height: 1 },
	{ kind: 'tasks', x: 0, y: 2, width: 2, height: 2 },
	{ kind: 'latency', x: 2, y: 2, width: 1, height: 2 }
];

const outerTargetConfig = {
	rowSizing: 'minmax(0, 7rem)',
	columnSizing: 'minmax(0, 1fr)',
	layout: {
		type: 'free',
		minColumns: 3,
		maxColumns: 3,
		minRows: 4,
		maxRows: 5,
		collapsibility: 'any',
		packing: 'vertical'
	}
} as const;

const EMPTY_DROPS: DropCounts = { compound: 0, team: 0, tasks: 0 };

/**
 * Three boards are live on this page: the outer free grid of tiles, and the
 * two inner flow boards that live inside two of those tiles. Each one reports
 * its own drops, so the log below can name which board took the pointer.
 */
export default function CompoundExample() {
	const [drops, setDrops] = useState<DropCounts>(EMPTY_DROPS);
	const [flashed, setFlashed] = useState<DropScope | null>(null);
	const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [resetToken, setResetToken] = useState(0);

	// Stable across renders so the inner boards' configs (which close over it)
	// never change identity and push a pointless update into core.
	const commit = useCallback((scope: DropScope) => {
		setDrops((current) => ({ ...current, [scope]: current[scope] + 1 }));
		setFlashed(scope);
		clearTimeout(flashTimer.current);
		flashTimer.current = setTimeout(() => setFlashed(null), 900);
	}, []);

	useEffect(() => () => clearTimeout(flashTimer.current), []);

	function reset() {
		clearTimeout(flashTimer.current);
		setDrops(EMPTY_DROPS);
		setFlashed(null);
		// Remounting the subtree re-flushes the declarative widget registrations,
		// restoring all three boards to their initial arrangement.
		setResetToken((token) => token + 1);
	}

	const outerConfig = useMemo<FlexiBoardConfiguration>(
		() => ({
			widgetDefaults: {
				draggability: 'full',
				resizability: 'none',
				transition: cssTransitionConfig(),
				// Trigger maps replace wholesale, so all four keys are given. Outer tiles
				// are grabbable only through the header handle, so an immediate touch grab
				// cannot fight page scrolling — unlike the inner boards, which keep the
				// library's long-press default for touch.
				grabTrigger: {
					default: immediateTriggerConfig(),
					mouse: immediateTriggerConfig(),
					touch: immediateTriggerConfig(),
					pen: immediateTriggerConfig()
				}
			},
			registry: {
				tile: { component: CompoundTile, className: tileClass }
			},
			onLayoutChange: () => commit('compound')
		}),
		[commit]
	);

	// componentProps is a prop seam into core: a fresh object each render would
	// rewrite every tile's config on every drop, so it is built once.
	const tileWidgets = useMemo(
		() => tiles.map((tile) => ({ ...tile, componentProps: { kind: tile.kind, onCommit: commit } })),
		[commit]
	);

	// Soft sheet: the nesting claim is annotation, so it belongs in the fig band.
	return (
		<main className="bg-paper flex h-full min-h-0 w-full flex-col p-3 lg:p-5">
			<Sheet
				className="min-h-0 flex-1"
				fig="Compound · nested boards · every drag scoped to its owner"
				aside="3 boards live"
				footer={<DropLog drops={drops} flashed={flashed} />}
			>
				<div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 lg:px-8 lg:pt-5">
					<header className="flex shrink-0 items-baseline justify-between gap-4">
						<div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
							<h1 className="text-ink font-serif text-xl lg:text-[30px]">Ops overview</h1>
							<p className="text-body min-w-0 text-xs lg:text-[13px]">
								Two tiles are themselves boards — drag an avatar; the tile never moves.
							</p>
						</div>
						<Button variant="outline" size="icon" className="rounded-full" onClick={reset} title="Reset layout">
							<RotateCcw className="size-4" />
							<span className="sr-only">Reset layout</span>
						</Button>
					</header>

					<FlexiBoard
						key={resetToken}
						className="min-h-0 grow overflow-x-clip overflow-y-auto"
						config={outerConfig}
					>
						<FlexiTarget
							keyName="tiles"
							className="bg-stage h-full gap-2 overflow-x-clip rounded-[10px] pb-4 lg:pb-5"
							config={outerTargetConfig}
						>
							{tileWidgets.map((tile) => (
								<FlexiWidget
									key={tile.kind}
									type="tile"
									x={tile.x}
									y={tile.y}
									width={tile.width}
									height={tile.height}
									componentProps={tile.componentProps}
								/>
							))}
						</FlexiTarget>
					</FlexiBoard>
				</div>
			</Sheet>
		</main>
	);
}
