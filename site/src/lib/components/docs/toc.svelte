<script lang="ts">
	import { Construction } from 'lucide-svelte';
	import TocTree from './toc-tree.svelte';
	import { createTableOfContents } from '@melt-ui/svelte';
	import { pushState } from '$app/navigation';

  const {
    elements: { item },
    states: { activeHeadingIdxs, headingsTree },
  } = createTableOfContents({
    selector: '#docs-content',
    exclude: ['h1', 'h4', 'h5', 'h6'],
    activeType: 'all',
    /**
     * Here we can optionally provide SvelteKit's `pushState` function.
     * This function preserve navigation state within the framework.
     */
    pushStateFn: pushState,
    headingFilterFn: (heading) => !heading.hasAttribute('data-toc-ignore'),
    scrollFn: (id) => {
      /**
       * Here we're overwriting the default scroll function
       * so that we only scroll within the ToC preview
       * container, instead of the entire page.
       */
      const container = document.getElementById('main-content');
      const element = document.getElementById(id);

      if (container && element) {
        container.scrollTo({
          top: element.offsetTop - container.offsetTop - 16,
          behavior: 'smooth',
        });
      }
    },
  });
</script>

<div class="flex flex-col gap-1">
	<h2 class="mb-1 text-lg font-semibold">On this page</h2>
	{#key $headingsTree}
        <TocTree
			tree={$headingsTree}
			activeHeadingIdxs={$activeHeadingIdxs}
			{item}
        />
	{/key}
</div>

<h2 class="flex items-center gap-4 rounded-md border px-4 py-2 text-left text-xs lg:text-sm">
	<Construction /> These docs are still a work in progress.
</h2>
