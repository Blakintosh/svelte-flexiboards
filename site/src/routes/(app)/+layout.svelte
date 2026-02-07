<script lang="ts">
	import Header from '$lib/components/nav/header.svelte';

	let { children } = $props();
</script>

<div class="min-h-svh">
	<Header />

	<main class="mb-14 flex min-h-0 flex-1 flex-col px-4 lg:px-8" id="main-content">
		{@render children()}
	</main>
</div>

<footer
	class="h-14 w-full shrink-0 border-t border-dashed bg-background/80 py-4 text-center text-sm text-muted-foreground backdrop-blur-sm"
>
	Made by <a href="https://github.com/Blakintosh" class="underline font-medium underline-offset-4" target="_blank">Blakintosh</a>.
	The Flexiboards source code is available on <a href="https://github.com/Blakintosh/svelte-flexiboards" class="underline font-medium underline-offset-4" target="_blank">GitHub</a>.
</footer>
