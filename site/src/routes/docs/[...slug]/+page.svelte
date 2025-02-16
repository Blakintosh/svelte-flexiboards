<script lang="ts">
	import OnThisPage from '$lib/components/docs/on-this-page.svelte';
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
		class="prose prose-sm mx-auto h-full min-h-0 w-full shrink-0 py-24 dark:prose-invert lg:prose-xl"
	>
		<div class="not-prose">
			<h1 class="mb-4 text-5xl font-bold text-foreground">{data.doc.meta.title}</h1>
			<p class="text-muted-foreground">{data.doc.meta.description}</p>
		</div>
		<PageComponent />
	</article>
	<aside class="hidden h-full flex-1 lg:block">
		<div class="sticky top-0 flex flex-col gap-8 py-24 text-base">
			<OnThisPage />
		</div>
	</aside>
</div>
