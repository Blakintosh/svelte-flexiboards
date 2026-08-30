<script module lang="ts">
	export type Motion = 'spring' | 'css';

	export type GalleryToolbarProps = {
		motion: Motion;
		onMotionChange: (motion: Motion) => void;
		onShuffle: () => void;
		onReset: () => void;
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowRightLeft from 'lucide-svelte/icons/arrow-right-left';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';

	let { motion, onMotionChange, onShuffle, onReset }: GalleryToolbarProps = $props();

	const modes: { id: Motion; label: string; hint: string }[] = [
		{ id: 'spring', label: 'Spring', hint: 'Spring motion — springTransitionConfig()' },
		{ id: 'css', label: 'CSS', hint: 'CSS motion — cssTransitionConfig()' }
	];
</script>

<div class="flex items-center gap-2">
	<!-- One mode control: the chosen segment fills, it never grows a shadow. -->
	<div class="border-ink flex items-center border" role="group" aria-label="Motion model">
		{#each modes as mode (mode.id)}
			<Button
				variant="ghost"
				size="sm"
				class="h-8 rounded-none px-2.5 text-xs sm:px-3 {motion === mode.id
					? 'bg-tint text-ink'
					: 'text-body'}"
				aria-pressed={motion === mode.id}
				title={mode.hint}
				onclick={() => onMotionChange(mode.id)}
			>
				{mode.label}
			</Button>
		{/each}
	</div>

	<!-- Shuffle keeps an ink frame; Reset is the quiet one beside it. -->
	<Button
		variant="outline"
		size="sm"
		class="border-ink h-8 rounded-none text-xs"
		aria-label="Shuffle the plates"
		onclick={onShuffle}
	>
		<ArrowRightLeft class="size-3.5 sm:hidden" />
		<span class="hidden sm:inline">Shuffle</span>
	</Button>

	<Button
		variant="ghost"
		size="sm"
		class="text-body h-8 rounded-none text-xs"
		aria-label="Reset the layout"
		onclick={onReset}
	>
		<RotateCcw class="size-3.5 sm:hidden" />
		<span class="hidden sm:inline">Reset</span>
	</Button>
</div>
