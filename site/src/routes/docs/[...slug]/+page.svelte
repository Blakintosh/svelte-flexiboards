<script lang="ts">
	import Toc from '$lib/components/docs/toc.svelte';
	import DocumentationSidebar from '$lib/components/docs/documentation-sidebar.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const PageComponent = $derived(data.doc.content);

	$effect(() => {
		document.title = `${data.doc.meta.title} ⋅ Docs ⋅ Flexiboards`;
	});
</script>

<div class="flex h-full items-stretch gap-16">
	<nav class="hidden h-full flex-1 lg:block">
		<div class="sticky top-0 flex flex-col gap-8 py-24 text-base">
			<DocumentationSidebar />
		</div>
	</nav>
	<article
		class="prose prose-sm mx-auto h-full min-h-0 w-full shrink-0 py-8 dark:prose-invert lg:prose-lg 2xl:prose-xl lg:py-24"
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
	<aside class="hidden h-full flex-1 lg:block">
		<div class="sticky top-0 flex flex-col gap-8 py-24 text-base">
			<Toc />
		</div>
	</aside>
</div>
