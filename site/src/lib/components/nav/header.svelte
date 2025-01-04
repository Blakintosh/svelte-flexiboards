<script>
	import ThemeSelector from './theme-selector.svelte';
	// import { Button } from '$site/components/ui/button/index.js';
</script>

<header class="flex items-center justify-between border-b px-8 py-2">
	<div class="flex w-[80%] items-center justify-start gap-4">
		<div class="flex flex-col items-start gap-[0.075rem]">
			<div class="h-1 w-[1rem] rounded-[1px] bg-orange-500"></div>
			<div class="h-1 w-[0.67rem] rounded-[1px] bg-orange-500"></div>
			<div class="h-1 w-[0.33rem] rounded-[1px] bg-orange-500"></div>
		</div>
		<h1 class="font-display text-2xl font-medium">Flexiboards</h1>
	</div>

	<div class="flex w-[20%] items-center justify-end">
		<!-- <Button href="https://github.com/blakintosh/flexiboards" variant="link">GitHub</Button> -->
		<ThemeSelector />
	</div>
</header>
