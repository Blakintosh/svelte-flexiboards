<script lang="ts">
	import { type TableOfContentsItem, type TableOfContentsElements, melt } from '@melt-ui/svelte';
	import { cn } from '$lib/utils';

	export let tree: TableOfContentsItem[] = [];
	export let activeHeadingIdxs: number[];
	export let item: TableOfContentsElements['item'];
	export let level = 1;
</script>

<!-- Ruler ticks: a short rule marks each entry; the active tick lengthens and inks fx-accent. -->
<ul class={cn('m-0 flex list-none flex-col', level !== 1 && 'pl-[17px]')}>
	{#if tree && tree.length}
		{#each tree as heading, i (i)}
			<li class="mt-0">
				<a
					href="#{heading.id}"
					use:melt={$item(heading.id)}
					class={cn(
						'text-body group flex items-center gap-2.5 py-1.5 font-mono text-[12px] leading-snug no-underline transition-colors duration-[120ms]',
						'hover:text-ink',
						'data-[active]:text-fx-accent'
					)}
				>
					{#if level === 1}
						<span
							class="bg-rule group-data-[active]:bg-fx-accent h-px w-[7px] shrink-0 transition-all duration-[120ms] group-data-[active]:w-[14px]"
						></span>
					{/if}
					<!-- The heading's own rendered markup (inline code), copied from the page. -->
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<span class="min-w-0 break-all">{@html heading.node.innerHTML}</span>
				</a>
				{#if heading.children && heading.children.length}
					<svelte:self tree={heading.children} level={level + 1} {activeHeadingIdxs} {item} />
				{/if}
			</li>
		{/each}
	{/if}
</ul>
