<script lang="ts">
	import Music from 'lucide-svelte/icons/music';
	import SkipBack from 'lucide-svelte/icons/skip-back';
	import Play from 'lucide-svelte/icons/play';
	import SkipForward from 'lucide-svelte/icons/skip-forward';
</script>

<!--
	2 × 2, the one feature tile. The transport glyphs are decorative: no hover, no
	cursor change, no handler — the whole tile is a grab target and nothing here
	should read as a second thing to click.
-->
<div class="flex h-full w-full flex-col gap-2 overflow-hidden p-3">
	<div class="border-rule-soft bg-tint grid min-h-0 flex-1 place-items-center rounded-[9px] border">
		<Music class="text-blue size-6" />
	</div>
	<div class="flex min-w-0 flex-col">
		<span class="text-ink truncate text-[12px]">Nightwork</span>
		<span class="text-faint truncate text-[10px] font-semibold">Hot Chip</span>
	</div>
	<div class="bg-rule-faint h-1 w-full rounded-full">
		<div class="bg-ink h-full w-[38%] rounded-full"></div>
	</div>
	<div class="text-faint flex items-center justify-center gap-4" aria-hidden="true">
		<SkipBack class="size-4" />
		<Play class="size-4" />
		<SkipForward class="size-4" />
	</div>
</div>
