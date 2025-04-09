<script lang="ts">
	import Toc from '$lib/components/docs/toc.svelte';
	import DocumentationSidebar from '$lib/components/docs/documentation-sidebar.svelte';
	import type { PageData } from './$types';
	import { ScrollArea } from "$lib/components/ui/scroll-area";

	let { data }: { data: PageData } = $props();

	const PageComponent = $derived(data.doc.content);

	$effect(() => {
		document.title = `${data.doc.meta.title} ⋅ Docs ⋅ Flexiboards`;
	});
</script>

<div class="flex h-full gap-16 relative">
	<nav class="hidden shrink-0 w-64 lg:block">
		<div class="sticky top-14">
			<div class="flex flex-col h-[calc(100%-6.5rem)] max-h-[calc(100%-6.5rem)] min-h-0 overflow-y-auto gap-8 text-base border-r px-4 border-dashed py-12">
				<DocumentationSidebar />
			</div>
		</div>
	</nav>
	<div class="grow flex items-start gap-16 overflow-y-auto px-8">
		<article
			class="prose prose-sm mx-auto w-full shrink-0 py-8 dark:prose-invert lg:prose-lg 2xl:prose-xl lg:py-12 overflow-y-auto"
			id="docs-content"
		>
			<div class="not-prose">
				<h1 class="mb-2 text-3xl font-bold text-foreground lg:mb-4 lg:text-4xl 2xl:text-5xl">
					{data.doc.meta.title}
				</h1>
				<p class="text-muted-foreground">{data.doc.meta.description}</p>
			</div>
			<PageComponent />
		</article>
	</div>
	<aside class="hidden w-64 lg:block">
		<div class="flex flex-col gap-8 text-base sticky top-14 py-12">
			<Toc />
		</div>
	</aside>
</div>
