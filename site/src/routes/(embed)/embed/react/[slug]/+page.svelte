<script lang="ts">
	import ReactExample from '$lib/components/docs/react-example.svelte';
	import { reportExampleStatus } from '$lib/example-status';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.slug.charAt(0).toUpperCase() + data.slug.slice(1)} - Flexiboards Example</title>
</svelte:head>

<div class="flex h-full w-full items-stretch">
	{#key data.slug}
		<ReactExample
			load={() => import(`$lib/react-components/examples/pages/${data.slug}-example.tsx`)}
			onstatuschange={reportExampleStatus}
		/>
	{/key}
</div>
