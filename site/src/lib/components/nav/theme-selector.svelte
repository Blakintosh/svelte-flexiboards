<script lang="ts">
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import Monitor from 'lucide-svelte/icons/monitor';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';

	const themes = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	] as const;
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={[
			buttonVariants({ variant: 'outline', size: 'icon' }),
			'focus-visible:outline-ink relative size-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-0'
		]}
	>
		<Sun
			data-theme-icon
			aria-hidden="true"
			class="size-4 rotate-0 opacity-100 transition-[transform,opacity] duration-150 motion-reduce:transition-none dark:-rotate-90 dark:opacity-0"
		/>
		<Moon
			data-theme-icon
			aria-hidden="true"
			class="absolute size-4 rotate-90 opacity-0 transition-[transform,opacity] duration-150 motion-reduce:transition-none dark:rotate-0 dark:opacity-100"
		/>
		<span class="sr-only">Toggle theme</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.RadioGroup
			value={$userPrefersMode}
			onValueChange={(value) => setMode(value as 'light' | 'dark' | 'system')}
			aria-label="Theme"
		>
			{#each themes as theme}
				<DropdownMenu.RadioItem value={theme.value}>
					<theme.icon class="size-4" aria-hidden="true" />{theme.label}
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
