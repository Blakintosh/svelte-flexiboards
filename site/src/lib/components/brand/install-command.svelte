<script lang="ts">
	/*
	  Ink field, paper text, muted-blue prompt, vermillion block caret. The caret
	  is the only animation permitted in a static block.
	*/
	import Check from 'lucide-svelte/icons/check';

	let {
		command,
		class: className = ''
	}: { command: string; class?: string } = $props();

	let copied = $state(false);

	async function copy() {
		await navigator.clipboard.writeText(command);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="flex items-stretch border border-ink font-mono {className}">
	<!-- `text-on-ink`, not `text-paper`: the field ground never inverts, so its
	     text must not either. -->
	<div class="flex flex-1 items-center gap-3 bg-field px-[18px] py-[14px] text-[15px] text-on-ink">
		<span class="text-on-ink-faint">$</span>
		<span class="truncate">{command}</span>
		<span class="animate-fb-blink h-4 w-2 shrink-0 bg-vermillion" aria-hidden="true"></span>
	</div>
	<button
		type="button"
		onclick={copy}
		class="label flex items-center gap-2 border-l border-ink px-[18px] text-xs tracking-[0.1em] text-body transition-colors duration-[120ms] hover:bg-tint hover:text-ink"
	>
		{#if copied}
			<Check class="size-3.5" />
			Copied
		{:else}
			Copy
		{/if}
	</button>
</div>
