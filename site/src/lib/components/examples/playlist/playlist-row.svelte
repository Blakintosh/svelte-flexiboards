<script lang="ts">
	import { FlexiGrab } from '@flexiboards/svelte';
	import Button from '$lib/components/examples/common/button.svelte';
	import { cn } from '$lib/utils.js';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';
	import Play from 'lucide-svelte/icons/play';
	import Pause from 'lucide-svelte/icons/pause';
	import Heart from 'lucide-svelte/icons/heart';
	import { formatDuration, type Track } from './tracks.js';

	type PlaylistRowProps = {
		track: Track;
		position: number;
		isCurrent: boolean;
		playing: boolean;
		liked: boolean;
		onTogglePlay: () => void;
		onToggleLike: () => void;
	};

	let { track, position, isCurrent, playing, liked, onTogglePlay, onToggleLike }: PlaylistRowProps =
		$props();
</script>

<!--
	The row body is ordinary interactive markup. Only the FlexiGrab handle starts a
	drag, so the buttons below stay clickable — that is the point of the example.
-->
<div
	data-track={track.id}
	class={cn(
		'flex h-full w-full items-center gap-2 pr-2',
		isCurrent && 'border-blue bg-tint border-l-2'
	)}
>
	<!-- Vermillion means movement: the handle answers in accent on hover and focus. -->
	<FlexiGrab
		class={cn(
			'text-faint flex h-10 w-8 shrink-0 items-center justify-center rounded-[8px] transition-colors duration-[120ms]',
			'hover:bg-tint-accent hover:text-fx-accent active:bg-tint-accent active:text-fx-accent',
			'focus-visible:outline-fx-accent focus-visible:outline-2 focus-visible:-outline-offset-2'
		)}
	>
		<GripVertical size={16} />
		<span class="sr-only">Reorder {track.title}</span>
	</FlexiGrab>

	<!-- The top of the queue is what is playing, so the top row holds the transport. -->
	<div class="flex w-10 shrink-0 items-center justify-center">
		{#if isCurrent}
			<Button
				variant="ghost"
				size="icon"
				class="text-blue hover:text-blue size-8 rounded-full"
				aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
				onclick={onTogglePlay}
			>
				{#if playing}
					<Pause class="size-4" />
				{:else}
					<Play class="size-4" />
				{/if}
			</Button>
		{:else}
			<span class="text-faint font-mono text-[11px] tabular-nums">{position}</span>
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 items-baseline gap-2">
		<span class="text-ink truncate text-[13px]">{track.title}</span>
		<span class="text-body hidden truncate text-[13px] sm:inline">{track.artist}</span>
	</div>

	<Button
		variant="ghost"
		size="icon"
		class={cn(
			'size-8 shrink-0 rounded-full',
			liked ? 'text-fx-accent hover:bg-tint-accent hover:text-fx-accent' : 'text-faint'
		)}
		aria-pressed={liked}
		aria-label={liked ? `Unlike ${track.title}` : `Like ${track.title}`}
		onclick={onToggleLike}
	>
		<Heart class={cn('size-4', liked && 'fill-current')} />
	</Button>

	<span class="text-faint w-11 shrink-0 text-right font-mono text-[11px] tabular-nums">
		{formatDuration(track.seconds)}
	</span>
</div>
