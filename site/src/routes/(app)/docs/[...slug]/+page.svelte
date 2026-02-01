<script lang="ts">
	import Toc from '$lib/components/docs/toc.svelte';
	import DocumentationSidebar from '$lib/components/docs/documentation-sidebar.svelte';
	import type { PageData } from './$types';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	let { data }: { data: PageData } = $props();

	const PageComponent = $derived(data.doc.content);

	$effect(() => {
		document.title = `${data.doc.meta.title} ⋅ Docs ⋅ Flexiboards`;
	});
</script>

<div class="relative flex h-full gap-16">
	<nav class="hidden w-64 shrink-0 border-r border-dashed lg:block">
		<div class="sticky top-14">
			<div
				class="flex h-[calc(100%-6.5rem)] max-h-[calc(100%-6.5rem)] min-h-0 flex-col gap-8 overflow-y-auto py-12 pr-4 text-base"
			>
				<DocumentationSidebar />
			</div>
		</div>
	</nav>
	<article
		class="prose prose-sm mx-auto w-full shrink-0 overflow-y-auto py-8 dark:prose-invert lg:prose-lg lg:py-12"
		id="docs-content"
	>
		<div class="not-prose text-base">
			<h1 class="mb-2 text-2xl font-bold text-foreground lg:mb-4 lg:text-3xl 2xl:text-4xl">
				{data.doc.meta.title}
			</h1>
			<p class="text-muted-foreground text-base lg:text-lg">{data.doc.meta.description}</p>
		</div>
		<PageComponent />
	</article>
	<aside class="hidden w-64 lg:block">
		<div class="sticky top-14 flex flex-col gap-8 py-12 text-base">
			<Toc />
		</div>
	</aside>
</div>
