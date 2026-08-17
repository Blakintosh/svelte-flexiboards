<script lang="ts">
	/*
	  One row, hard-divided, no radius. The selected tab is ink-filled with a
	  vermillion tick; preview status rides the label in sentence case; unbuilt
	  frameworks appear as faint mono text, not as clickable tabs.
	*/
	import { framework, frameworks, plannedFrameworks } from './framework.svelte';

	let { class: className = '' }: { class?: string } = $props();
</script>

<div class="flex border border-ink {className}">
	{#each frameworks as fw, i (fw.id)}
		{@const selected = framework.current === fw.id}
		<button
			type="button"
			onclick={() => (framework.current = fw.id)}
			aria-pressed={selected}
			class="label flex items-center gap-2 px-5 py-[11px] text-xs tracking-[0.12em] transition-colors duration-[120ms]
				{i > 0 ? 'border-l border-ink' : ''}
				{selected ? 'bg-ink text-paper' : 'text-body hover:bg-tint hover:text-ink'}"
		>
			{#if selected}
				<span class="size-1.5 bg-vermillion" aria-hidden="true"></span>
			{/if}
			{fw.label}
			{#if fw.status === 'preview'}
				<span class="text-[10px] normal-case tracking-[0.04em] {selected ? 'text-on-ink-blue' : 'text-faint'}">
					(preview)
				</span>
			{/if}
		</button>
	{/each}
	<div
		class="label hidden flex-1 items-center border-l border-ink px-4 text-[10px] text-faint sm:flex"
	>
		{plannedFrameworks.join(' · ')} · planned
	</div>
</div>
