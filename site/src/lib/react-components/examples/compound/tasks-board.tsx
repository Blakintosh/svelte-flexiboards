import { FlexiBoard, FlexiTarget, FlexiWidget, cssTransitionConfig } from '@flexiboards/react';
import type { FlexiBoardConfiguration, FlexiWidgetController } from '@flexiboards/react';
import { useMemo } from 'react';
import { cn } from '$lib/utils.js';
import TaskRow, { type Task } from './task-row';
import type { DropScope } from './drop-log';

const TASKS: Task[] = [
	{ id: 'certs', title: 'Rotate signing certificates', status: 'ready', age: '2d' },
	{ id: 'usage', title: 'Backfill usage events', status: 'blocked', age: '5d' },
	{ id: 'cdn', title: 'Migrate CDN origin', status: 'ready', age: '1w' },
	{ id: 'webhooks', title: 'Deprecate v1 webhooks', status: 'queued', age: '2w' }
];

// The drop preview reads as a dashed placeholder; the row in hand lifts off
// the queue instead of taking an accent outline.
const rowClass = (widget: FlexiWidgetController) =>
	cn(
		'min-w-0',
		widget.isShadow && 'rounded-[10px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'rounded-[10px] shadow-lift'
	);

const targetConfig = {
	rowSizing: 'minmax(0, 2.25rem)',
	columnSizing: 'minmax(0, 1fr)',
	layout: {
		type: 'flow',
		flowAxis: 'row',
		placementStrategy: 'append',
		columns: 1
	}
} as const;

/**
 * A second inner board, this one a single column: rows reflow vertically and
 * renumber themselves from their own y. Dragging a row never moves the tile.
 */
export default function TasksBoard({ onCommit }: { onCommit: (scope: DropScope) => void }) {
	const config = useMemo<FlexiBoardConfiguration>(
		() => ({
			widgetDefaults: {
				draggability: 'full',
				resizability: 'none',
				transition: cssTransitionConfig()
			},
			registry: {
				task: { component: TaskRow, className: rowClass }
			},
			onLayoutChange: () => onCommit('tasks')
		}),
		[onCommit]
	);

	return (
		<FlexiBoard className="h-full min-h-0 min-w-0" config={config}>
			<FlexiTarget keyName="queue" className="bg-tint-2 gap-1 rounded-[9px] p-1" config={targetConfig}>
				{TASKS.map((task) => (
					<FlexiWidget key={task.id} type="task" componentProps={{ task }} />
				))}
			</FlexiTarget>
		</FlexiBoard>
	);
}
