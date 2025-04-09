<script lang="ts">
	import Header from '$lib/components/nav/header.svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<ModeWatcher />

<Header />

<main class="flex-1 mb-14" id="main-content">
	{@render children()}
</main>

<footer class="fixed bottom-0 shrink-0 h-14 w-full py-4 text-center text-sm text-muted-foreground border-t border-dashed bg-background/80 backdrop-blur">
	Work in progress. Expect bugs and/or breaking changes!
</footer>