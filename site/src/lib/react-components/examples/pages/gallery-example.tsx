import {
	FlexiBoard,
	FlexiTarget,
	ResponsiveFlexiBoard,
	cssTransitionConfig,
	springTransitionConfig,
	useFromCore
} from '@flexiboards/react';
import type {
	FlexiBoardConfiguration,
	FlexiTargetController,
	FlexiTargetPartialConfiguration,
	FlexiWidgetController,
	ResponsiveFlexiBoardController,
	ResponsiveFlexiLayout
} from '@flexiboards/react';
import { clsx } from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';
import Sheet from '../common/sheet';
import GalleryPlate, { newDeal } from '../gallery/gallery-plate';
import GalleryToolbar from '../gallery/gallery-toolbar';
import type { Motion } from '../gallery/gallery-toolbar';
import {
	BREAKPOINT_GRIDS,
	DEFAULT_LAYOUTS,
	TARGET_KEY,
	buildShuffledLayouts
} from '../gallery/plates';
import type { Breakpoint } from '../gallery/plates';

// Anything provisional — the drop preview, the plate in hand — is fx-accent.
const className = (widget: FlexiWidgetController) =>
	clsx([
		'rounded-[14px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-fx-accent motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
		widget.isShadow && 'border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'shadow-lift rotate-[2.5deg]',
		// The plate in hand greys out wherever the mosaic has no room for it.
		widget.dropRejected && 'border-rule-soft border opacity-30 saturate-0'
	]);

const REGISTRY: FlexiBoardConfiguration['registry'] = {
	plate: {
		component: GalleryPlate,
		className,
		draggability: 'full',
		resizability: 'both',
		minWidth: 1,
		minHeight: 1,
		maxWidth: 2,
		maxHeight: 2
	},
	panorama: {
		component: GalleryPlate,
		className,
		draggability: 'full',
		resizability: 'both',
		// A panorama is wide by definition: it can never be made narrow or tall.
		minWidth: 2,
		minHeight: 1,
		maxWidth: 3,
		maxHeight: 1
	}
};

// One target configuration per breakpoint, built once: the FlexiTarget prop
// seam compares by identity, so a fresh object each render would push a
// pointless update into core.
const TARGET_CONFIGS: Record<Breakpoint, FlexiTargetPartialConfiguration> = Object.fromEntries(
	(Object.keys(BREAKPOINT_GRIDS) as Breakpoint[]).map((bp) => {
		const bpGrid = BREAKPOINT_GRIDS[bp];
		return [
			bp,
			{
				rowSizing: bpGrid.rowSizing,
				layout: {
					type: 'free',
					minColumns: bpGrid.columns,
					maxColumns: bpGrid.columns,
					minRows: bpGrid.minRows,
					maxRows: bpGrid.maxRows,
					collapsibility: 'any',
					// A mosaic is a composition: nothing re-packs behind the user's back.
					packing: 'none'
				}
			} satisfies FlexiTargetPartialConfiguration
		];
	})
) as Record<Breakpoint, FlexiTargetPartialConfiguration>;

export default function GalleryExample() {
	const [motion, setMotion] = useState<Motion>('spring');

	// Not React state: only ever read inside handlers and the one-shot loadLayouts.
	const layouts = useRef<ResponsiveFlexiLayout>(DEFAULT_LAYOUTS);
	const responsiveRef = useRef<ResponsiveFlexiBoardController | null>(null);

	// The live readouts need the controllers to be *reactive*, not merely
	// reachable, so they land in state as well — deferred a microtask because
	// onfirstcreate runs during the child's render.
	const [responsive, setResponsive] = useState<ResponsiveFlexiBoardController | null>(null);
	const [target, setTarget] = useState<FlexiTargetController | null>(null);

	/*
		The transition lives on the board's widget defaults and nowhere else — a
		registry entry would shadow it and dead-lock the toggle. The interpolator
		re-reads it when the next animation starts, so a swap needs no remount.
	*/
	const boardConfig = useMemo<FlexiBoardConfiguration>(
		() => ({
			widgetDefaults: {
				transition: motion === 'spring' ? springTransitionConfig() : cssTransitionConfig()
			},
			registry: REGISTRY
		}),
		[motion]
	);

	const responsiveConfig = useMemo(
		() => ({
			breakpoints: { lg: 1024, sm: 640 },
			ssrBreakpoint: 'lg',
			loadLayouts: () => layouts.current
		}),
		[]
	);

	const breakpoint = useFromCore(
		useCallback(() => (responsive?.currentBreakpoint ?? 'lg') as Breakpoint, [responsive])
	);
	const grid = BREAKPOINT_GRIDS[breakpoint] ?? BREAKPOINT_GRIDS.default;

	const rows = useFromCore(useCallback(() => target?.rows, [target])) ?? grid.minRows;
	const columns = useFromCore(useCallback(() => target?.columns, [target])) ?? grid.columns;

	// The fig band reads out whichever config the board is actually running on.
	const transitionCall = motion === 'spring' ? 'springTransitionConfig()' : 'cssTransitionConfig()';

	function shuffle() {
		layouts.current = buildShuffledLayouts(layouts.current);
		newDeal();
		responsiveRef.current?.importLayout(layouts.current);
	}

	function reset() {
		layouts.current = DEFAULT_LAYOUTS;
		newDeal();
		responsiveRef.current?.importLayout(layouts.current);
	}

	const plateBoard = (bp: Breakpoint) => (
		<FlexiBoard
			className="min-h-0 grow overflow-y-auto overflow-x-clip [scrollbar-gutter:stable]"
			config={boardConfig}
		>
			<FlexiTarget
				keyName={TARGET_KEY}
				onfirstcreate={(created) => queueMicrotask(() => setTarget(created))}
				className="h-full gap-3 overflow-x-clip lg:gap-4"
				config={TARGET_CONFIGS[bp]}
			/>
		</FlexiBoard>
	);

	return (
		<main className="bg-paper flex h-full min-h-0 w-full flex-col p-3 sm:p-4 lg:p-6">
			<Sheet
				className="min-h-0 flex-1"
				fig="Gallery · free 2D grid · packing: none"
				aside={`transition: ${transitionCall}`}
			>
				{/* The toolbar lives in the sheet's own header rather than a band of its own. */}
				<header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pb-3 pt-4 lg:px-9 lg:pt-5">
					<div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
						<h1 className="text-ink font-serif text-2xl lg:text-[30px]">Gallery</h1>
						{/* The row count is live: it ticks up when a resize grows the grid. */}
						<span className="text-faint text-[11px] font-semibold">
							{columns} × {rows} · rows {grid.minRows}–{grid.maxRows} · neighbours make room
						</span>
					</div>

					<GalleryToolbar
						motion={motion}
						onMotionChange={setMotion}
						onShuffle={shuffle}
						onReset={reset}
					/>
				</header>

				{/* Touch grabs are a long press by default, so say so rather than let a tap fail. */}
				<p className="text-body shrink-0 px-4 pb-3 text-[13px] lg:px-9">
					<span className="hidden sm:inline">
						Drag a plate to move it. Drag the corner mark to resize.
					</span>
					<span className="sm:hidden">Press and hold a plate to move it.</span>
				</p>

				<div className="flex min-h-0 flex-1 flex-col px-4 pb-4 lg:px-9 lg:pb-5">
					<ResponsiveFlexiBoard
						config={responsiveConfig}
						onfirstcreate={(controller) => {
							responsiveRef.current = controller;
							queueMicrotask(() => setResponsive(controller));
						}}
						lg={plateBoard('lg')}
						sm={plateBoard('sm')}
					>
						{plateBoard('default')}
					</ResponsiveFlexiBoard>
				</div>
			</Sheet>
		</main>
	);
}
