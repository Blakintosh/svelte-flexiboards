<script lang="ts">
	import { MessageSquareWarning } from 'lucide-svelte';
	import TocTree from './toc-tree.svelte';
	import { createTableOfContents } from '@melt-ui/svelte';
	import { pushState } from '$app/navigation';

	const {
		elements: { item },
		states: { activeHeadingIdxs, headingsTree }
	} = createTableOfContents({
		selector: '#docs-content',
		exclude: ['h1', 'h4', 'h5', 'h6'],
		activeType: 'all',
		pushStateFn: pushState,
		headingFilterFn: (heading) => !heading.hasAttribute('data-toc-ignore')
	});
</script>

<nav class="flex flex-col gap-3">
	<h2 class="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
		On this page
	</h2>
	{#key $headingsTree}
		<TocTree tree={$headingsTree} activeHeadingIdxs={$activeHeadingIdxs} {item} />
	{/key}
</nav>

<div
	class="flex items-start gap-3 rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground"
>
	<MessageSquareWarning class="mt-0.5 size-4 shrink-0" />
	<span>These docs are still a work in progress.</span>
</div>
