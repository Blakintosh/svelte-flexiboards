<script lang="ts">
	import Header from '$lib/site/components/nav/header.svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />

<Header />

<main class="grid w-full grow place-items-center overflow-y-auto">
	<div class="max-w-[1440px] px-8">
		{@render children()}
	</div>
</main>

<footer class="w-full py-4 text-center text-sm text-muted-foreground">
	Work in progress. Expect bugs!
</footer>
