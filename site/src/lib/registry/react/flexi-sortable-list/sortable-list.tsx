'use client';
import { Root } from './root';
import { Item } from './item';
import { Grabber } from '../flexi-handles/grabber';

export type SortableListProps = {
	items: { id: string; label: string }[];
	className?: string;
	onReorder?: (ids: string[]) => void;
};
/** Convenience API retained for existing registry consumers. Use Root + Item for custom content. */
export function SortableList({ items, ...props }: SortableListProps) {
	return (
		<Root {...props}>
			{items.map((item) => (
				<Item key={item.id} id={item.id}>
					<Grabber label={`Move ${item.label}`} />
					<span className="min-w-0 flex-1 truncate">{item.label}</span>
				</Item>
			))}
		</Root>
	);
}
