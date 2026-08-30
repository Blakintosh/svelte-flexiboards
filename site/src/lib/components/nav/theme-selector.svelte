<script lang="ts">
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	import { resetMode, setMode } from 'mode-watcher';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={[buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative']}>
		<Sun
			data-theme-icon
			class="h-[1.2rem] w-[1.2rem] rotate-0 opacity-100 transition-[transform,opacity] duration-[150ms] ease-[var(--ease-snap)] dark:-rotate-90 dark:opacity-0"
		/>
		<Moon
			data-theme-icon
			class="absolute h-[1.2rem] w-[1.2rem] rotate-90 opacity-0 transition-[transform,opacity] duration-[150ms] ease-[var(--ease-snap)] dark:rotate-0 dark:opacity-100"
		/>
		<span class="sr-only">Toggle theme</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item onclick={() => setMode('light')}>Light</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => setMode('dark')}>Dark</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => resetMode()}>System</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
