<script lang="ts">
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
	<h2 class="label text-[10px] text-faint">On this page</h2>
	{#key $headingsTree}
		<TocTree tree={$headingsTree} activeHeadingIdxs={$activeHeadingIdxs} {item} />
	{/key}
</nav>

<!-- Sheet legend: page metadata as ruled mono rows; draft status stays fx-accent. -->
<div class="flex flex-col gap-2 border-t border-rule pt-4 font-mono text-[10.5px] text-faint">
	<div class="flex justify-between"><span>Sections</span><span class="text-body">{$headingsTree.length}</span></div>
	<div class="flex justify-between"><span>Status</span><span class="text-fx-accent">Draft</span></div>
</div>
