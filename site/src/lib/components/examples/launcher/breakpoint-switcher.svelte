<script lang="ts">
	import Button from '$lib/components/examples/common/button.svelte';
	import { cn } from '$lib/utils.js';
	import { BREAKPOINTS, type Pin } from './layouts.js';

	type Props = {
		value: Pin;
		onchange: (pin: Pin) => void;
	};

	let { value, onchange }: Props = $props();

	const options: { id: Pin; label: string; title: string }[] = [
		{ id: 'auto', label: 'Auto', title: 'Follow the viewport width' },
		{ id: 'lg', label: 'LG', title: `Pin the lg layout (${BREAKPOINTS.lg.threshold})` },
		{ id: 'md', label: 'MD', title: `Pin the md layout (${BREAKPOINTS.md.threshold})` },
		{ id: 'sm', label: 'SM', title: `Pin the sm layout (${BREAKPOINTS.sm.threshold})` }
	];
</script>

<!--
	One pill row on a recessed stage ground: the active segment lifts to a panel
	chip. No eyebrow — "Auto / LG / MD / SM" reads as a breakpoint control on its
	own.
-->
<div
	class="bg-stage flex items-center gap-0.5 rounded-full p-[3px]"
	role="group"
	aria-label="Breakpoint"
>
	{#each options as option (option.id)}
		<Button
			variant="ghost"
			size="sm"
			class={cn(
				'h-7 rounded-full px-3 text-xs font-semibold transition-colors duration-[120ms]',
				value === option.id
					? 'bg-panel shadow-seg text-ink hover:bg-panel'
					: 'text-faint hover:text-ink bg-transparent hover:bg-transparent'
			)}
			title={option.title}
			aria-pressed={value === option.id}
			onclick={() => onchange(option.id)}
		>
			{option.label}
		</Button>
	{/each}
</div>
