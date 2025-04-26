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

<main class="mb-14 flex min-h-0 flex-1 flex-col px-4 lg:px-8" id="main-content">
	{@render children()}
</main>

<footer
	class="fixed bottom-0 h-14 w-full shrink-0 border-t border-dashed bg-background/80 py-4 text-center text-sm text-muted-foreground backdrop-blur"
>
	Preview version. Expect bugs!
</footer>
