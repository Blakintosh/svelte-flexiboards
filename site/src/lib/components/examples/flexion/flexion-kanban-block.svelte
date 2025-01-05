<script lang="ts">
	import { FlexiBoard, FlexiWidget, FlexiTarget } from 'svelte-flexiboards';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import FlexionKanbanList from './flexion-kanban-list.svelte';
</script>

<nav class="flex w-full min-w-0 justify-between border-b">
	<ul class="flex w-full min-w-0 gap-2">
		<li>
			<Button variant="ghost" class="rounded-none border-b-2 border-primary font-bold">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-folder-dot"
					><path
						d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"
					/><circle cx="12" cy="13" r="1" /></svg
				>
				Active
			</Button>
		</li>
		<li>
			<Button variant="ghost">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-archive"
					><rect width="20" height="5" x="2" y="3" rx="1" /><path
						d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"
					/><path d="M10 12h4" /></svg
				>
				Archived
			</Button>
		</li>
	</ul>

	<ul class="flex gap-2">
		<li>
			<Button variant="ghost" size="icon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-ellipsis"
					><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle
						cx="5"
						cy="12"
						r="1"
					/></svg
				>
			</Button>
		</li>
		<li>
			<Button size={'sm'}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg
				>
				Add
			</Button>
		</li>
	</ul>
</nav>

<FlexiBoard
	config={{
		targetDefaults: {
			layout: {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			}
		}
	}}
	class="flex w-full min-w-0 items-start justify-center gap-12 px-4 py-4"
>
	<FlexionKanbanList
		category="today"
		categoryLabel="Today"
		bgClass="bg-green-300"
		dotClass="bg-green-500"
		items={['Eggs', 'Bread', 'Milk']}
	/>
	<FlexionKanbanList
		category="tomorrow"
		categoryLabel="Tomorrow"
		bgClass="bg-amber-300"
		dotClass="bg-amber-500"
		items={['Fish', 'Chips']}
	/>
	<FlexionKanbanList
		category="never"
		categoryLabel="Never"
		bgClass="bg-red-300"
		dotClass="bg-red-500"
		items={['Pasta', 'Ice cream']}
	/>
</FlexiBoard>
