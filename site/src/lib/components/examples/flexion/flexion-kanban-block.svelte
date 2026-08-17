<script lang="ts">
	import {
		FlexiBoard,
		FlexiWidget,
		FlexiTarget,
		simpleTransitionConfig,
		type FlexiBoardController
	} from 'svelte-flexiboards';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import FlexionKanbanList from './flexion-kanban-list.svelte';

	import FolderDot from 'lucide-svelte/icons/folder-dot';
	import Archive from 'lucide-svelte/icons/archive';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Plus from 'lucide-svelte/icons/plus';

	let board: FlexiBoardController | undefined = $state();
</script>

<nav class="flex w-full min-w-0 justify-between border-b border-rule">
	<ul class="flex w-full min-w-0 gap-2">
		<li>
			<!-- The active tab takes a vermillion rule, not a fill. -->
			<Button variant="ghost" class="-mb-px border-b border-vermillion text-ink">
				<FolderDot />
				Active
			</Button>
		</li>
		<li>
			<Button variant="ghost">
				<Archive />
				Archived
			</Button>
		</li>
	</ul>

	<ul class="flex gap-2">
		<li>
			<Button variant="ghost" size="icon">
				<Ellipsis />
			</Button>
		</li>
		<li>
			<Button size={'sm'}>
				<Plus />
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
		},
		widgetDefaults: {
			transition: simpleTransitionConfig()
		}
	}}
	class="flex flex-col lg:flex-row w-full min-w-0 items-center lg:items-start justify-center gap-12 px-4 py-4"
	bind:controller={board}
>
	<FlexionKanbanList
		category="today"
		categoryLabel="Today"
		bgClass="bg-tint text-blue"
		dotClass="bg-blue"
		items={['Eggs', 'Bread', 'Milk']}
	/>
	<FlexionKanbanList
		category="tomorrow"
		categoryLabel="Tomorrow"
		bgClass="bg-tint-2 text-body"
		dotClass="bg-faint"
		items={['Fish', 'Chips']}
	/>
	<FlexionKanbanList
		category="never"
		categoryLabel="Never"
		bgClass="bg-tint-accent text-vermillion"
		dotClass="bg-vermillion"
		items={['Pasta', 'Ice cream']}
	/>
</FlexiBoard>
