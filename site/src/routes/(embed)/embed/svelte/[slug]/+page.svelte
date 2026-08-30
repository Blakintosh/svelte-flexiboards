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

	let { data } = $props();

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
</script>

<svelte:head>
	<title>{data.slug.charAt(0).toUpperCase() + data.slug.slice(1)} - Flexiboards Example</title>
</svelte:head>

<div class="flex h-full w-full items-stretch">
	<ExampleComponent />
</div>
