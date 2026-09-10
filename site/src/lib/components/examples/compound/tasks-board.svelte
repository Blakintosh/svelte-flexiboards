<script module lang="ts">
	import type { Task } from './task-row.svelte';

	const TASKS: Task[] = [
		{ id: 'certs', title: 'Rotate signing certificates', status: 'ready', age: '2d' },
		{ id: 'usage', title: 'Backfill usage events', status: 'blocked', age: '5d' },
		{ id: 'cdn', title: 'Migrate CDN origin', status: 'ready', age: '1w' },
		{ id: 'webhooks', title: 'Deprecate v1 webhooks', status: 'queued', age: '2w' }
	];
</script>

<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		cssTransitionConfig,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import TaskRow from './task-row.svelte';
	import type { DropScope } from './drop-log.svelte';
	import { cn } from '$lib/utils.js';

	let { onCommit }: { onCommit: (scope: DropScope) => void } = $props();

	// The drop preview reads as a dashed placeholder; the row in hand lifts off
	// the queue instead of taking an accent outline.
	const rowClass = (widget: FlexiWidgetController) =>
		cn(
			'min-w-0',
			widget.isShadow &&
				'rounded-[10px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
			widget.isGrabbed && 'rounded-[10px] shadow-lift'
		);
</script>

<!--
	A second inner board, this one a single column: rows reflow vertically and
	renumber themselves from their own y. Dragging a row never moves the tile.
-->
<FlexiBoard
	class="h-full min-h-0 min-w-0"
	config={{
		widgetDefaults: {
			draggability: 'full',
			resizability: 'none',
			transition: cssTransitionConfig()
		},
		registry: {
			task: { component: TaskRow, className: rowClass }
		},
		onLayoutChange: () => onCommit('tasks')
	}}
>
	<FlexiTarget
		key="queue"
		class="bg-tint-2 gap-1 rounded-[9px] p-1"
		config={{
			rowSizing: 'minmax(0, 2.25rem)',
			columnSizing: 'minmax(0, 1fr)',
			layout: {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append',
				columns: 1
			}
		}}
	>
		{#each TASKS as task (task.id)}
			<FlexiWidget type="task" componentProps={{ task }} />
		{/each}
	</FlexiTarget>
</FlexiBoard>
