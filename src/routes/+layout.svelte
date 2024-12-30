<script lang="ts">
	import Header from '$lib/site/components/nav/header.svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />

<Header />

<article class="grid w-full grow place-items-center overflow-y-auto">
	<div class="max-w-[1440px]">
		{@render children()}
	</div>
</article>
