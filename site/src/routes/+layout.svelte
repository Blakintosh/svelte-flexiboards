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

<main class="grid h-full min-h-0 w-full grow place-items-center overflow-y-auto" id="main-content">
	<div class="h-full w-full px-8 lg:max-w-[1440px]">
		{@render children()}
	</div>
</main>

<footer class="w-full py-4 text-center text-sm text-muted-foreground">
	Work in progress. Expect bugs and/or breaking changes!
</footer>
