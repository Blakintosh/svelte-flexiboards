import { useFlexiWidget } from '@flexiboards/react';
import { useMediaQuery } from '$lib/react-hooks/use-media-query';
import Grabber from '../common/grabber';
import Resizer from '../common/resizer';
import { ActiveTile, ChurnTile, MrrTile, RevenueTile, SubscriptionsTile } from './tiles';

// Sub-registry mapping tile types to their content and label.
const tileRegistry = {
	mrr: { component: MrrTile, title: 'MRR' },
	subscriptions: { component: SubscriptionsTile, title: 'Subscriptions' },
	churn: { component: ChurnTile, title: 'Churn' },
	revenue: { component: RevenueTile, title: 'Revenue · 6 mo' },
	active: { component: ActiveTile, title: 'Active now' }
} as const;

export default function DashboardTile() {
	// Reactive proxy: draggability/resizable reads re-render when edit mode flips.
	const widget = useFlexiWidget();
	const desktop = useMediaQuery('(min-width: 1024px)');
	// Larger handles on mobile for better touch targets.
	const grabberSize = desktop ? 18 : 22;

	const tileType = widget.metadata?.type as keyof typeof tileRegistry;
	const tileConfig = tileRegistry[tileType] ?? tileRegistry.mrr;
	const ContentComponent = tileConfig.component;

	// Every widget is the same soft plate: white card, rounded corners, a resting
	// shadow, and — only while the board is editable — a visible grab handle next
	// to the label.
	return (
		<div
			className="bg-panel border-rule-soft shadow-card relative flex h-full w-full flex-col rounded-[14px] border p-3.5 lg:p-4"
			data-tile-type={tileType}
		>
			<div className="text-faint flex shrink-0 items-center gap-1.5 text-[11.5px] font-semibold">
				{widget.draggability == 'full' && <Grabber size={grabberSize} className="-my-1.5 -ml-1.5" />}
				<span className="truncate">{tileConfig.title}</span>
			</div>

			<div className="mt-3 flex min-h-0 flex-1 flex-col justify-end lg:mt-4">
				<ContentComponent />
			</div>

			{widget.resizable && (
				<Resizer size={grabberSize} className="absolute right-1 bottom-1 cursor-col-resize" />
			)}
		</div>
	);
}
