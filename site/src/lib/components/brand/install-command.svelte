<script lang="ts">
	/*
	  Ink field, paper text, muted-blue prompt, fx-accent block caret. The caret
	  is the only animation permitted in a static block.

	  On a framework switch the command dissolves — blurring and loosening its
	  letter-spacing — and the replacement condenses back out of the blur
	  (`swap-out` / `swap-in` in app.css), 100ms behind the picker.
	*/
	import Check from 'lucide-svelte/icons/check';
	import Copy from 'lucide-svelte/icons/copy';
	import { framework } from './framework.svelte';

	let { command, class: className = '' }: { command: string; class?: string } = $props();

	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout>;

	const phase = $derived(framework.swap);

	async function copy() {
		await navigator.clipboard.writeText(command);
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 3000);
	}
</script>

<div class="border-ink flex items-stretch border font-mono {className}">
	<!-- `text-on-ink`, not `text-paper`: the field ground never inverts, so its
	     text must not either. -->
	<div class="bg-field text-on-ink flex flex-1 items-center gap-3 px-[18px] py-[14px] text-[15px]">
		<span class="text-on-ink-faint">$</span>
		{#key command}
			<span
				class="truncate [--swap-delay:100ms] {phase === 'out'
					? 'swap-out'
					: phase === 'in'
						? 'swap-in'
						: ''}"
			>
				{command}
			</span>
		{/key}
		<span
			class="bg-fx-accent h-4 w-2 shrink-0 [--swap-delay:100ms] {phase === 'out'
				? 'swap-out'
				: phase === 'in'
					? 'swap-in'
					: 'animate-fb-blink'}"
			aria-hidden="true"
		></span>
	</div>
	<button
		type="button"
		onclick={copy}
		aria-label="Copy install command"
		class="ui border-ink text-body hover:bg-tint hover:text-ink flex items-center border-l px-[18px] transition-colors duration-[120ms]"
	>
		<!-- The icon swap condenses out of a short blur; the press squashes it. -->
		{#key copied}
			<span
				class="ease-snap flex transition-transform duration-[130ms] active:scale-[0.78] motion-safe:animate-[fb-blurin_320ms_var(--ease-snap)]"
			>
				{#if copied}
					<Check class="size-4" />
				{:else}
					<Copy class="size-4" />
				{/if}
			</span>
		{/key}
	</button>
</div>
