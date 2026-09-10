<script lang="ts">
	/*
	  One row, hard-divided, no radius. The selection is an ink slab that
	  *slides*: a duplicate row of labels in paper sits in an absolutely
	  positioned overlay whose clip-path tracks the selected tab, so the fill
	  glides from one tab to the other instead of jumping. Tabs are sans (they
	  are controls, not annotations); unbuilt frameworks appear as faint mono
	  text, not as clickable tabs.
	*/
	import { framework, frameworks, plannedFrameworks, type Framework } from './framework.svelte';
	import { SiSvelte, SiReact } from '@icons-pack/svelte-simple-icons';

	const ICONS: Record<Framework, typeof SiSvelte> = { svelte: SiSvelte, react: SiReact };

	let { class: className = '' }: { class?: string } = $props();

	let container = $state<HTMLElement>();
	const tabs: (HTMLElement | undefined)[] = $state([]);

	type Segment = { left: number; width: number };
	let metrics = $state<{ segments: Segment[]; containerWidth: number } | null>(null);

	function measure() {
		if (!container || tabs.some((t) => !t)) return;
		metrics = {
			segments: tabs.map((t) => ({ left: t!.offsetLeft, width: t!.offsetWidth })),
			containerWidth: container.offsetWidth
		};
	}

	$effect(() => {
		measure();
		const observer = new ResizeObserver(measure);
		if (container) observer.observe(container);
		document.fonts?.ready.then(measure);
		return () => observer.disconnect();
	});

	const selectedIndex = $derived(frameworks.findIndex((f) => f.id === framework.selected));

	const clip = $derived.by(() => {
		if (!metrics || selectedIndex < 0) return null;
		const seg = metrics.segments[selectedIndex];
		if (!seg) return null;
		const right = Math.max(0, metrics.containerWidth - seg.left - seg.width);
		return `inset(0 ${right}px 0 ${seg.left}px)`;
	});
</script>

<div class="border-ink relative flex border {className}" bind:this={container}>
	{#each frameworks as fw, i (fw.id)}
		{@const selected = framework.selected === fw.id}
		{@const Icon = ICONS[fw.id]}
		<button
			type="button"
			bind:this={tabs[i]}
			onclick={() => (framework.current = fw.id)}
			aria-pressed={selected}
			class="ui ease-snap flex items-center gap-2 px-[18px] py-[11px] text-[13px] transition-colors duration-[140ms]
				{i > 0 ? 'border-ink border-l' : ''}
				{selected ? 'text-body' : 'text-body hover:bg-tint hover:text-ink'}"
		>
			<Icon size={14} aria-hidden="true" />
			{fw.label}
			{#if fw.status !== 'stable'}
				<span class="text-faint text-[11px] font-medium tracking-[0.04em]">({fw.status})</span>
			{/if}
		</button>
	{/each}
	<div
		class="label border-ink text-faint hidden flex-1 items-center border-l px-4 text-[10px] sm:flex"
	>
		{plannedFrameworks.join(' · ')} · planned
	</div>

	{#if clip}
		<!-- The sliding ink fill: a clipped duplicate of the tab row in paper. -->
		<div
			class="bg-ink pointer-events-none absolute inset-0 flex transition-[clip-path] duration-[420ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] motion-reduce:transition-none"
			style="clip-path: {clip}"
			aria-hidden="true"
		>
			{#each frameworks as fw, i (fw.id)}
				{@const Icon = ICONS[fw.id]}
				<div
					class="ui text-paper flex items-center gap-2 px-[18px] py-[11px] text-[13px]"
					style={i > 0 ? 'margin-left: 1px' : undefined}
				>
					<Icon size={14} aria-hidden="true" />
					{fw.label}
					{#if fw.status !== 'stable'}
						<span class="text-on-ink-blue text-[11px] font-medium tracking-[0.04em]">
							({fw.status})
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
