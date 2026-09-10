import { FlexiWidget } from '@flexiboards/react';
import type { FlexiWidgetProps } from '@flexiboards/react';
import type { LucideIcon } from 'lucide-react';
import TileContents from './tile-contents';

export type TileProps = Omit<FlexiWidgetProps, 'children'> & {
	title: string;
	on: boolean;
	onIcon?: LucideIcon;
	offIcon?: LucideIcon;
};

export default function Tile({ title, on, onIcon, offIcon, ...props }: TileProps) {
	return (
		<FlexiWidget
			{...props}
			draggability="none"
			resizability="none"
			maxWidth={2}
			maxHeight={1}
			component={TileContents}
			componentProps={{
				title,
				on,
				onIcon,
				offIcon
			}}
		/>
	);
}
