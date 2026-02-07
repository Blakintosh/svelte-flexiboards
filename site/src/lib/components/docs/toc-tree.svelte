<script lang="ts">
	import {
		type TableOfContentsItem,
		type TableOfContentsElements,
		melt
	} from '@melt-ui/svelte';
	import { cn } from '$lib/utils';

	export let tree: TableOfContentsItem[] = [];
	export let activeHeadingIdxs: number[];
	export let item: TableOfContentsElements['item'];
	export let level = 1;
</script>

<ul class={cn('m-0 flex list-none flex-col gap-0.5', level !== 1 && 'ml-3 border-l pl-3')}>
	{#if tree && tree.length}
		{#each tree as heading, i (i)}
			<li class="mt-0">
				<a
					href="#{heading.id}"
					use:melt={$item(heading.id)}
					class={cn(
						'block rounded-md px-2 py-1.5 text-sm text-muted-foreground no-underline transition-colors',
						'hover:text-foreground',
						'data-[active]:text-foreground data-[active]:font-medium'
					)}
				>
					{@html heading.node.innerHTML}
				</a>
				{#if heading.children && heading.children.length}
					<svelte:self tree={heading.children} level={level + 1} {activeHeadingIdxs} {item} />
				{/if}
			</li>
		{/each}
	{/if}
</ul>
