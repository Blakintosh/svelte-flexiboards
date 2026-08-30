<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
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
	One filled segment row: a single ink hairline around four flush segments, the
	active one filled. No eyebrow — "Auto / LG / MD / SM" reads as a breakpoint
	control on its own.
-->
<div class="border-ink flex items-center border" role="group" aria-label="Breakpoint">
	{#each options as option (option.id)}
		<Button
			variant="ghost"
			size="sm"
			class={cn(
				'h-8 rounded-none px-3 text-xs transition-colors duration-[120ms]',
				value === option.id ? 'bg-tint text-ink' : 'text-body hover:text-ink'
			)}
			title={option.title}
			aria-pressed={value === option.id}
			onclick={() => onchange(option.id)}
		>
			{option.label}
		</Button>
	{/each}
</div>
