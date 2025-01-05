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

<main class="grid w-full grow place-items-center overflow-y-auto">
	<div class="w-full px-8 py-8 lg:max-w-[1440px]">
		{@render children()}
	</div>
</main>

<footer class="w-full py-4 text-center text-sm text-muted-foreground">
	Work in progress. Expect bugs!
</footer>
