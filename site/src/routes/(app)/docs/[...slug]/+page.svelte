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

<!-- Three columns divided by single 1px rules; the prose measure is capped by `.prose`. -->
<div class="relative flex h-full gap-8 xl:gap-12">
	<nav class="hidden w-60 shrink-0 border-r border-rule lg:block">
		<!-- 60px header, so sticky content clears at top-15. -->
		<div class="sticky top-15">
			<div
				class="flex h-[calc(100%-6.5rem)] max-h-[calc(100%-6.5rem)] min-h-0 flex-col overflow-y-auto py-12 pr-6"
			>
				<DocumentationSidebar />
			</div>
		</div>
	</nav>
	<!--
		No `dark:prose-invert`: the brand prose tokens in app.css already flip under
		`.dark`, and the plugin's inverted greys would override them.
	-->
	<article
		class="prose prose-sm mx-auto min-w-0 flex-1 overflow-y-auto py-8 lg:prose-lg lg:py-12"
		id="docs-content"
	>
		<div class="not-prose mb-10 border-b border-rule pb-8">
			<span class="label block text-[10px] text-vermillion">Documentation</span>
			<h1 class="mb-3 mt-3 font-serif text-[30px] font-semibold text-ink lg:text-[38px]">
				{data.doc.meta.title}
			</h1>
			<p class="max-w-[60ch] text-[17px] leading-relaxed text-body">
				{data.doc.meta.description}
			</p>
		</div>
		<PageComponent />
	</article>
	<aside class="hidden w-60 shrink-0 border-l border-rule xl:block">
		<div class="sticky top-15 flex flex-col gap-6 py-12 pl-6">
			<Toc />
		</div>
	</aside>
</div>
