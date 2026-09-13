<script lang="ts">
	import DashboardExample from '$lib/components/examples/pages/dashboard-example.svelte';
	import NotesExample from '$lib/components/examples/pages/notes-example.svelte';
	import NumbersExample from '$lib/components/examples/pages/numbers-example.svelte';
	import FlowExample from '$lib/components/examples/pages/flow-example.svelte';
	import FlexspressiveExample from '$lib/components/examples/pages/flexspressive-example.svelte';
	import ProductsExample from '$lib/components/examples/pages/products-example.svelte';
	import KanbanExample from '$lib/components/examples/pages/kanban-example.svelte';
	import FormBuilderExample from '$lib/components/examples/pages/form-builder-example.svelte';
	import CompoundExample from '$lib/components/examples/pages/compound-example.svelte';
	import GalleryExample from '$lib/components/examples/pages/gallery-example.svelte';
	import LauncherExample from '$lib/components/examples/pages/launcher-example.svelte';
	import PlaylistExample from '$lib/components/examples/pages/playlist-example.svelte';

	import { browser } from '$app/environment';
	import { ssrSlugs } from '../../shared';
	import { tick } from 'svelte';
	import { reportExampleStatus } from '$lib/example-status';
	import ExampleLoading from '$lib/components/ui/example-loading.svelte';

	let { data } = $props();
	// See ssrSlugs: only opted-in examples render on the server.
	const render = $derived(browser || ssrSlugs.includes(data.slug));

	const examples = {
		dashboard: DashboardExample,
		notes: NotesExample,
		numbers: NumbersExample,
		flow: FlowExample,
		flexspressive: FlexspressiveExample,
		products: ProductsExample,
		kanban: KanbanExample,
		'form-builder': FormBuilderExample,
		compound: CompoundExample,
		gallery: GalleryExample,
		launcher: LauncherExample,
		playlist: PlaylistExample
	} as const;

	let ExampleComponent = $derived(examples[data.slug as keyof typeof examples]);
	$effect(() => {
		void data.slug;
		let cancelled = false;
		let frame: number;
		tick().then(() => {
			if (cancelled) return;
			frame = requestAnimationFrame(() => reportExampleStatus('ready'));
		});
		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
		};
	});
</script>

<svelte:head>
	<title>{data.slug.charAt(0).toUpperCase() + data.slug.slice(1)} - Flexiboards Example</title>
</svelte:head>

<div class="flex h-full w-full items-stretch">
	{#if render}
		<ExampleComponent />
	{:else}
		<div class="grid w-full place-items-center p-6"><ExampleLoading /></div>
	{/if}
</div>
