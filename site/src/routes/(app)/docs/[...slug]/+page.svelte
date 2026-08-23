<script lang="ts">
	import Toc from '$lib/components/docs/toc.svelte';
	import DocumentationSidebar from '$lib/components/docs/documentation-sidebar.svelte';
	import { page } from '$app/state';
	import { locateDoc } from '$lib/docs-directory';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const PageComponent = $derived(data.doc.content);
	const location = $derived(locateDoc(page.url.pathname));
	const editUrl = $derived(
		`https://github.com/blakintosh/svelte-flexiboards/edit/main/site/src/content/docs/${page.url.pathname.replace(/^\/docs\//, '')}.md`
	);

	$effect(() => {
		document.title = `${data.doc.meta.title} ⋅ Docs ⋅ Flexiboards`;
	});
</script>

<!-- Three columns divided by single 1px rules; the prose measure is capped by `.prose`. -->
<div class="relative flex h-full">
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
	<!-- The lattice spans the whole middle column; `.prose` caps only the measure inside it. -->
	<div class="graph-paper min-w-0 flex-1 overflow-y-auto px-8 xl:px-12">
		<article
			class="prose prose-sm docs-sections mx-auto py-8 lg:prose-lg lg:py-12"
			id="docs-content"
		>
		<div class="not-prose mb-10 border-b border-rule pb-8">
			<div class="mb-4 flex items-center gap-2.5 text-[10px] label">
				<span class="text-faint">{location?.section.section ?? 'Documentation'}</span>
				{#if location}
					<span class="text-rule">/</span>
					<span class="text-vermillion">Page {location.plate}</span>
				{/if}
			</div>
			<h1 class="mb-3 font-serif text-[30px] font-semibold text-ink lg:text-[38px]">
				{data.doc.meta.title}
			</h1>
			<p class="max-w-[60ch] text-[17px] leading-relaxed text-body">
				{data.doc.meta.description}
			</p>
			<a
				href={editUrl}
				target="_blank"
				rel="noreferrer"
				class="mt-5 inline-block font-mono text-[10.5px] text-body no-underline transition-colors duration-[120ms] hover:text-vermillion"
			>
				Edit this page ↗
			</a>
		</div>
		<PageComponent />
		{#if location && (location.prev || location.next)}
			<nav class="not-prose mt-14 grid grid-cols-2 border border-rule bg-card">
				{#if location.prev}
					<a
						href={location.prev.href}
						class="border-r border-rule p-5 no-underline transition-colors duration-[120ms] hover:text-vermillion"
					>
						<span class="label block text-[10px] text-faint">← Previous</span>
						<span class="mt-1.5 block font-serif text-[16px] font-semibold">{location.prev.title}</span>
					</a>
				{:else}
					<div class="border-r border-rule"></div>
				{/if}
				{#if location.next}
					<a
						href={location.next.href}
						class="p-5 text-right no-underline transition-colors duration-[120ms] hover:text-vermillion"
					>
						<span class="label block text-[10px] text-faint">Next →</span>
						<span class="mt-1.5 block font-serif text-[16px] font-semibold">{location.next.title}</span>
					</a>
				{/if}
			</nav>
		{/if}
		</article>
	</div>
	<aside class="hidden w-60 shrink-0 border-l border-rule xl:block">
		<div class="sticky top-15 flex flex-col gap-6 py-12 pl-6">
			<Toc />
		</div>
	</aside>
</div>
