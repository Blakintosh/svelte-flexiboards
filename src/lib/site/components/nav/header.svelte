<script>
	import ThemeSelector from './theme-selector.svelte';
</script>

<header class="flex items-center justify-between border-b px-8 py-2">
	<div class="flex w-[80%] items-center justify-start">
		<h1 class="font-display text-2xl font-semibold">Flexiboards</h1>
	</div>

	<div class="flex w-[20%] items-center justify-end">
		<ThemeSelector />
	</div>
</header>
