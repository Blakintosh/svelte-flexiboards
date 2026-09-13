<script lang="ts">
	import { framework, frameworks, type Framework } from './framework.svelte';
	import { SiSvelte, SiReact } from '@icons-pack/svelte-simple-icons';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { align = 'right', class: className = '' }: { align?: 'left' | 'right'; class?: string } =
		$props();
	const badges: Record<Framework, { icon: typeof SiSvelte; background: string }> = {
		svelte: { icon: SiSvelte, background: '#ff3e00' },
		react: { icon: SiReact, background: '#087ea4' }
	};
	const selected = $derived(framework.selectedMeta);
	const SelectedIcon = $derived(badges[selected.id].icon);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(
			buttonVariants({ variant: 'outline', size: 'sm' }),
			'focus-visible:outline-ink h-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-0',
			className
		)}
	>
		<span
			class="flex size-5 items-center justify-center rounded-[5px] text-white"
			style:background={badges[selected.id].background}
			aria-hidden="true"
		>
			<SelectedIcon size={12} />
		</span>
		<span>{selected.label}</span>
		<ChevronDown class="size-3.5" aria-hidden="true" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align={align === 'left' ? 'start' : 'end'}>
		<DropdownMenu.RadioGroup
			value={framework.selected}
			onValueChange={(value) => (framework.current = value as Framework)}
			aria-label="Framework"
		>
			{#each frameworks as fw (fw.id)}
				{@const Icon = badges[fw.id].icon}
				<DropdownMenu.RadioItem value={fw.id}>
					<span
						class="flex size-5 items-center justify-center rounded-[5px] text-white"
						style:background={badges[fw.id].background}
						aria-hidden="true"><Icon size={12} /></span
					>
					<span>{fw.label}</span>
					{#if fw.status !== 'stable'}<span class="text-body ml-auto text-xs">{fw.status}</span
						>{/if}
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
