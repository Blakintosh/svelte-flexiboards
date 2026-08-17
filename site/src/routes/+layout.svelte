<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { framework } from '$lib/components/brand/framework.svelte';

	let { children } = $props();

	// Restore the framework choice after hydration, so the server-rendered
	// default and the first client render agree.
	$effect(() => framework.hydrate());
</script>

<svelte:head>
	<title>Flexiboards</title>
	<meta name="description" content="Headless drag &amp; drop grids" />
</svelte:head>

<ModeWatcher />

{@render children()}
