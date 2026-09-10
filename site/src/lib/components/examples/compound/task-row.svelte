<script module lang="ts">
	export type TaskStatus = 'ready' | 'blocked' | 'queued';

	export type Task = {
		id: string;
		title: string;
		status: TaskStatus;
		age: string;
	};

	export type TaskRowProps = {
		task: Task;
	};

	const statusClass: Record<TaskStatus, string> = {
		ready: 'bg-blue',
		blocked: 'bg-fx-accent',
		queued: 'bg-faint'
	};
</script>

<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';

	let { task }: TaskRowProps = $props();

	// One column of flow, so the row index is the queue position.
	const widget = getFlexiwidgetCtx();
	const position = $derived(widget.y + 1);
</script>

<div
	class="border-rule-soft bg-panel flex h-full w-full min-w-0 cursor-grab items-center gap-2 rounded-[10px] border px-2.5"
>
	<span class="text-faint w-3 shrink-0 font-mono text-[11px]">{position}</span>
	<span class={cn('size-1.5 shrink-0 rounded-full', statusClass[task.status])} aria-hidden="true"
	></span>
	<span class="text-ink min-w-0 flex-1 truncate text-[12px] lg:text-[13px]">{task.title}</span>
	<span class="text-faint hidden shrink-0 font-mono text-[11px] sm:inline">{task.age}</span>
	<span class="sr-only">{task.status}, {task.age}, priority {position}</span>
</div>
