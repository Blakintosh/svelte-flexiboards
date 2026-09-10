<script lang="ts">
	/*
	  Header framework selector: a bordered button carrying the framework's
	  badge, opening a small floating menu. The menu is the one rounded, floating
	  surface the header owns — it reads as a popover, not board furniture.
	*/
	import { framework, frameworks, type Framework } from './framework.svelte';
	import { SiSvelte, SiReact } from '@icons-pack/svelte-simple-icons';

	/** Which edge the popover hangs from; `class` styles the trigger button. */
	let { align = 'right', class: className = '' }: { align?: 'left' | 'right'; class?: string } =
		$props();

	let wrap = $state<HTMLElement>();
	let open = $state(false);
	let closing = $state(false);
	let closeTimer: ReturnType<typeof setTimeout>;

	const BADGE: Record<Framework, { icon: typeof SiSvelte; background: string }> = {
		svelte: { icon: SiSvelte, background: '#ff3e00' },
		react: { icon: SiReact, background: '#087ea4' }
	};

	const selected = $derived(framework.selectedMeta);
	const SelectedIcon = $derived(BADGE[selected.id].icon);

	function close() {
		if (!open || closing) return;
		closing = true;
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => {
			open = false;
			closing = false;
		}, 160);
	}

	function toggle() {
		if (open) close();
		else {
			clearTimeout(closeTimer);
			open = true;
			closing = false;
		}
	}

	function pick(id: Framework) {
		close();
		framework.current = id;
	}

	$effect(() => {
		const onPointerDown = (e: PointerEvent) => {
			if (open && wrap && !wrap.contains(e.target as Node)) close();
		};
		document.addEventListener('pointerdown', onPointerDown, true);
		return () => document.removeEventListener('pointerdown', onPointerDown, true);
	});
</script>

<div class="relative" bind:this={wrap}>
	<button
		type="button"
		onclick={toggle}
		aria-haspopup="menu"
		aria-expanded={open}
		class="ui border-ink text-ink hover:bg-tint flex h-9 items-center gap-2 border bg-transparent px-3 text-[13px] transition-colors duration-[120ms] {className}"
	>
		<span
			class="flex size-5 items-center justify-center rounded-[6px] text-white"
			style="background: {BADGE[selected.id].background}"
		>
			<SelectedIcon size={12} />
		</span>
		<span>{selected.label}</span>
		<svg width="10" height="6" viewBox="0 0 10 6" fill="none" class="shrink-0">
			<path
				d="M1 1 L5 5 L9 1"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if open}
		<div
			class="absolute top-full z-30 min-w-[200px] pt-1.5 {align === 'left' ? 'left-0' : 'right-0'}"
			role="menu"
		>
			<div
				class="menu-surface bg-panel border-rule flex flex-col rounded-[12px] border p-1.5 shadow-[0_16px_36px_rgba(16,32,46,0.14)] {align ===
				'left'
					? 'origin-top-left'
					: 'origin-top-right'}"
				class:menu-closing={closing}
			>
				{#each frameworks as fw (fw.id)}
					{@const Icon = BADGE[fw.id].icon}
					<button
						type="button"
						role="menuitem"
						onclick={() => pick(fw.id)}
						class="ui text-ink hover:bg-tint-2 flex w-full items-center gap-2.5 rounded-[8px] border-none bg-transparent px-2.5 py-2 text-left text-[13px] transition-colors duration-[120ms]"
					>
						<span
							class="flex size-5 items-center justify-center rounded-[6px] text-white"
							style="background: {BADGE[fw.id].background}"
						>
							<Icon size={12} />
						</span>
						<span class="flex-1">
							{fw.label}
							{#if fw.status !== 'stable'}
								<span class="text-faint text-[11px] font-medium">({fw.status})</span>
							{/if}
						</span>
						{#if framework.selected === fw.id}
							<span class="bg-fx-accent size-1.5" aria-hidden="true"></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* The popover condenses in from the button and retreats the same way. Under
	   reduced motion it simply appears — no animation at all. */
	@media (prefers-reduced-motion: no-preference) {
		.menu-surface {
			animation: menu-in 180ms var(--ease-snap) both;
		}
		.menu-surface.menu-closing {
			animation: menu-out 160ms var(--ease-snap) both;
		}
	}
	@keyframes menu-in {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.94);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	@keyframes menu-out {
		from {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
		to {
			opacity: 0;
			transform: translateY(-6px) scale(0.94);
		}
	}
</style>
