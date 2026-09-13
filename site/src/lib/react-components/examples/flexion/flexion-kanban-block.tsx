import { FlexiBoard, simpleTransitionConfig } from '@flexiboards/react';
import type { FlexiBoardConfiguration } from '@flexiboards/react';
import FlexionKanbanList from './flexion-kanban-list';

const boardConfig: FlexiBoardConfiguration = {
	targetDefaults: {
		layout: {
			type: 'flow',
			flowAxis: 'row',
			placementStrategy: 'append'
		}
	},
	widgetDefaults: {
		transition: simpleTransitionConfig()
	}
};

/** No tabs or Add toolbar: this block is a task list inside a page, not an app shell. */
export default function FlexionKanbanBlock() {
	return (
		<FlexiBoard
			config={boardConfig}
			className="flex w-full min-w-0 flex-col items-center justify-center gap-8 py-2 lg:flex-row lg:items-start lg:justify-start lg:gap-8"
		>
			<FlexionKanbanList
				category="doing"
				categoryLabel="Doing"
				bgClass="bg-tint text-blue"
				dotClass="bg-blue"
				items={[
					{ label: 'Ship React adapter docs' },
					{ label: 'Record drag-demo video' },
					{ label: 'Fix drop flicker' }
				]}
			/>
			<FlexionKanbanList
				category="next"
				categoryLabel="Next"
				bgClass="bg-tint-2 text-body"
				dotClass="bg-faint"
				items={[{ label: 'Launch blog post' }, { label: 'Update comparison table' }]}
			/>
			<FlexionKanbanList
				category="done"
				categoryLabel="Done"
				bgClass="bg-tint-2 text-ink"
				dotClass="bg-ink"
				items={[{ label: '0.4.0 released', done: true }]}
			/>
		</FlexiBoard>
	);
}
