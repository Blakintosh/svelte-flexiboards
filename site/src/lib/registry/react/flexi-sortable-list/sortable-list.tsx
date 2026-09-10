import { useMemo } from 'react';
import {
	FlexiSortable,
	FlexiWidget,
	type FlexiBoardConfiguration,
	type FlexiWidgetController
} from '@flexiboards/react';
import { cn } from '@/lib/utils';
import { Grabber } from '@/components/flexi-handles/grabber';

type Item = { id: string; label: string };

export type SortableListProps = {
	items: Item[];
	className?: string;
	/** Fires with the ids in their new order after every drop. */
	onReorder?: (ids: string[]) => void;
};

const rowClass = (widget: FlexiWidgetController) =>
	cn(
		'bg-card text-card-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm',
		widget.isShadow && 'border-dashed opacity-60',
		widget.isGrabbed && 'shadow-md'
	);

export function SortableList({ items, className, onReorder }: SortableListProps) {
	// Ids travel in metadata so a drop can be reported back in list order. The
	// config is memoised because the board reads it by identity.
	const config = useMemo<FlexiBoardConfiguration>(
		() => ({
			onLayoutChange: (layout) =>
				onReorder?.((layout.list ?? []).map((entry) => String(entry.metadata?.id)))
		}),
		[onReorder]
	);

	return (
		<FlexiSortable className={cn('gap-2', className)} config={config}>
			{items.map((item) => (
				<FlexiWidget key={item.id} className={rowClass} metadata={{ id: item.id }}>
					<Grabber />
					<span className="min-w-0 flex-1 truncate">{item.label}</span>
				</FlexiWidget>
			))}
		</FlexiSortable>
	);
}
