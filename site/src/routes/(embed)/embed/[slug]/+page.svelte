<script lang="ts">
	import DashboardExample from '$lib/components/examples/pages/dashboard-example.svelte';
	import NotesExample from '$lib/components/examples/pages/notes-example.svelte';
	import NumbersExample from '$lib/components/examples/pages/numbers-example.svelte';
	import FlowExample from '$lib/components/examples/pages/flow-example.svelte';
	import FlexspressiveExample from '$lib/components/examples/pages/flexspressive-example.svelte';

	let { data } = $props();

	const examples = {
		dashboard: DashboardExample,
		notes: NotesExample,
		numbers: NumbersExample,
		flow: FlowExample,
		flexspressive: FlexspressiveExample
	} as const;

	let ExampleComponent = $derived(examples[data.slug as keyof typeof examples]);
</script>

<svelte:head>
	<title>{data.slug.charAt(0).toUpperCase() + data.slug.slice(1)} - Flexiboards Example</title>
</svelte:head>

<div class="flex h-full w-full items-stretch">
	<ExampleComponent />
</div>
