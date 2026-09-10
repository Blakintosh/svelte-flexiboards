import {
	FlexiBoard,
	FlexiTarget,
	ResponsiveFlexiBoard,
	simpleTransitionConfig
} from '@flexiboards/react';
import type {
	FlexiBoardConfiguration,
	FlexiWidgetController,
	ResponsiveFlexiBoardController,
	ResponsiveFlexiLayout
} from '@flexiboards/react';
import { clsx } from 'clsx';
import { Check, Pencil, RotateCcw } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import AppSidebar from '../flexiboard/app-sidebar';
import DashboardTile from '../flexiboard/dashboard-tile';
import Sheet from '../common/sheet';
import Button from '../common/button';

// Bumped when the tile set changed (score/sales → mrr/churn/revenue), so a
// stale saved layout can't resurrect widget types that no longer exist.
const STORAGE_KEY = 'flexiboards-dashboard-responsive-layout-v2';

const DEFAULT_LAYOUTS: ResponsiveFlexiLayout = {
	lg: {
		left: [
			{ type: 'immovable', x: 0, y: 0, width: 1, height: 1, metadata: { type: 'mrr' } },
			{ type: 'default', x: 1, y: 0, width: 1, height: 1, metadata: { type: 'subscriptions' } },
			{ type: 'default', x: 2, y: 0, width: 1, height: 1, metadata: { type: 'churn' } },
			{ type: 'default', x: 0, y: 1, width: 3, height: 1, metadata: { type: 'revenue' } },
			{ type: 'default', x: 0, y: 2, width: 1, height: 1, metadata: { type: 'active' } }
		]
	},
	default: {
		left: [
			{ type: 'immovable', x: 0, y: 0, width: 1, height: 1, metadata: { type: 'mrr' } },
			{ type: 'default', x: 1, y: 0, width: 1, height: 1, metadata: { type: 'subscriptions' } },
			{ type: 'default', x: 0, y: 1, width: 1, height: 1, metadata: { type: 'churn' } },
			{ type: 'default', x: 1, y: 1, width: 1, height: 1, metadata: { type: 'active' } },
			{ type: 'default', x: 0, y: 2, width: 2, height: 1, metadata: { type: 'revenue' } }
		]
	}
};

function loadLayouts(): ResponsiveFlexiLayout {
	const saved = localStorage.getItem(STORAGE_KEY);
	if (!saved) return DEFAULT_LAYOUTS;
	try {
		return JSON.parse(saved) as ResponsiveFlexiLayout;
	} catch {
		return DEFAULT_LAYOUTS;
	}
}

const responsiveConfig = {
	breakpoints: { lg: 1024 },
	ssrBreakpoint: 'lg',
	loadLayouts,
	onLayoutsChange: (layouts: ResponsiveFlexiLayout) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
	}
};

export default function DashboardExample() {
	// Edit mode is React state; the board config derives from it, so FlexiBoard's
	// prop seam sees a new object only when the mode actually flips (the Svelte
	// version mutates its $state config in place instead).
	const [editMode, setEditMode] = useState(false);
	const responsiveBoard = useRef<ResponsiveFlexiBoardController>(null);

	const boardConfig = useMemo<FlexiBoardConfiguration>(
		() => ({
			widgetDefaults: {
				draggability: editMode ? 'full' : 'none',
				resizability: editMode ? 'horizontal' : 'none'
			},
			registry: {
				default: {
					component: DashboardTile,
					// Grabbed tiles lift and tilt rather than taking an accent border;
					// the drop placeholder stays a soft dashed plate, never a pulse.
					className: (widget: FlexiWidgetController) =>
						clsx(
							'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
							widget.isGrabbed && 'shadow-lift rotate-[2.5deg]',
							widget.isShadow &&
								'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent'
						)
				},
				immovable: {
					component: DashboardTile,
					draggability: 'none',
					resizability: 'none'
				}
			}
		}),
		[editMode]
	);

	function resetLayout() {
		localStorage.removeItem(STORAGE_KEY);
		responsiveBoard.current?.importLayout(DEFAULT_LAYOUTS);
	}

	// Layout is already auto-saved, so "Done" just leaves edit mode.
	const editFooter = (
		<>
			<div className="flex items-center gap-3">
				<Pencil className="text-fx-accent size-4 shrink-0" />
				<div className="flex flex-col">
					<span className="text-fx-accent text-[11.5px] font-semibold">Editing layout</span>
					<span className="text-body hidden text-[12px] sm:block">
						Drag and resize widgets to customise
					</span>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" className="rounded-full" onClick={resetLayout}>
					<RotateCcw className="mr-1.5 size-4" />
					<span className="hidden sm:inline">Reset</span>
				</Button>
				<Button size="sm" className="rounded-full" onClick={() => setEditMode(false)}>
					<Check className="mr-1.5 size-4" />
					Done
				</Button>
			</div>
		</>
	);

	const board = (target: { rowSizing: string; columns: number; maxRows: number; gap: string }) => (
		<FlexiBoard className="min-h-0 grow overflow-y-auto overflow-x-clip" config={boardConfig}>
			<FlexiTarget
				keyName="left"
				className={`h-full overflow-x-clip ${target.gap}`}
				config={{
					rowSizing: target.rowSizing,
					layout: {
						type: 'free',
						minColumns: target.columns,
						maxColumns: target.columns,
						minRows: 3,
						maxRows: target.maxRows,
						collapsibility: 'any',
						packing: 'vertical'
					},
					widgetDefaults: { transition: simpleTransitionConfig() }
				}}
			/>
		</FlexiBoard>
	);

	return (
		<div className="flex h-full min-h-0 w-full grow">
			<AppSidebar />
			<main className="bg-paper flex min-h-0 w-full grow flex-col p-4 lg:p-6">
				{/*
					The sheet's caption band names the grid; the aside carries the one live
					status this example has — an accent pill while it is being edited.
				*/}
				<Sheet
					className="min-h-0 flex-1"
					fig="Dashboard · 3 × 4 free grid · responsive"
					aside={editMode ? '● Editing' : undefined}
					footer={editMode ? editFooter : undefined}
					asideClass="bg-tint-accent text-fx-accent-hover rounded-full px-2.5 py-1 font-sans text-[11px] font-bold"
					footerClass="bg-tint-accent"
					bodyClass="gap-4 p-4 lg:gap-5 lg:p-8"
				>
					<header className="flex shrink-0 items-center justify-between gap-4">
						<div className="flex items-baseline gap-3">
							<h1 className="text-ink font-serif text-2xl lg:text-[28px]">Overview</h1>
							<span className="text-faint font-mono text-[11px]">March 2026</span>
						</div>
						{!editMode && (
							<Button
								variant="outline"
								size="icon"
								className="rounded-full"
								onClick={() => setEditMode(true)}
								title="Edit layout"
							>
								<Pencil className="size-4" />
							</Button>
						)}
					</header>

					<ResponsiveFlexiBoard
						config={responsiveConfig}
						onfirstcreate={(controller) => (responsiveBoard.current = controller)}
						lg={board({
							rowSizing: 'minmax(0, 180px)',
							columns: 3,
							maxRows: 4,
							gap: 'gap-2 lg:gap-3.5'
						})}
					>
						{board({ rowSizing: 'minmax(0, 160px)', columns: 2, maxRows: 5, gap: 'gap-2' })}
					</ResponsiveFlexiBoard>
				</Sheet>
			</main>
		</div>
	);
}
