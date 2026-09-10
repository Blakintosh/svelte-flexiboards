<script lang="ts">
	import Toc from '$lib/components/docs/toc.svelte';
	import DocumentationSidebar from '$lib/components/docs/documentation-sidebar.svelte';
	import { page } from '$app/state';
	import { excludedFrameworks, locateDoc } from '$lib/docs-directory';
	import { framework, frameworks } from '$lib/components/brand/framework.svelte';
	import Callout from '$lib/components/docs/callout.svelte';
	import { copyText } from '$lib/copy-text';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// The Markdown twin of this page (see /docs/llms), for pasting into an assistant.
	const markdownHref = $derived(`${page.url.pathname}.md`);
	let copyState = $state<'idle' | 'copied' | 'failed'>('idle');

	async function copyMarkdown() {
		const markdown = await fetch(markdownHref).then((r) => r.text());
		copyState = (await copyText(markdown)) ? 'copied' : 'failed';
		setTimeout(() => (copyState = 'idle'), 2000);
	}

	const PageComponent = $derived(data.doc.content);
	const location = $derived(locateDoc(page.url.pathname, framework.current));
	// A framework-specific page viewed under another framework gets a notice
	// rather than a redirect: the content is still readable.
	const excluded = $derived(excludedFrameworks(page.url.pathname));
	const notApplicable = $derived(excluded.includes(framework.current));
	const appliesTo = $derived(
		frameworks
			.filter((f) => !excluded.includes(f.id))
			.map((f) => f.label)
			.join(', ')
	);
	const editUrl = $derived(
		`https://github.com/blakintosh/svelte-flexiboards/edit/main/site/src/content/docs/${page.url.pathname.replace(/^\/docs\//, '')}.md`
	);

	$effect(() => {
		document.title = `${data.doc.meta.title} ⋅ Docs ⋅ Flexiboards`;
	});
</script>

<!-- The Markdown twin of this page, for agents and anything else that would rather read plain text. -->
<svelte:head>
	<link rel="alternate" type="text/markdown" href={`${page.url.pathname}.md`} />
</svelte:head>

<!-- Three columns divided by single 1px rules; the prose measure is capped by `.prose`. -->
<div class="relative flex h-full">
	<nav class="border-rule hidden w-60 shrink-0 border-r lg:block">
		<!-- 60px header, so sticky content clears at top-15. -->
		<div class="top-15 sticky">
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
			class="prose prose-sm docs-sections lg:prose-lg mx-auto py-8 lg:py-12"
			id="docs-content"
		>
			<div class="not-prose border-rule mb-10 border-b pb-8">
				<div class="label mb-4 flex items-center gap-2.5 text-[10px]">
					<span class="text-faint">{location?.section.section ?? 'Documentation'}</span>
					{#if location}
						<span class="text-rule">/</span>
						<span class="text-fx-accent">Page {location.plate}</span>
					{/if}
				</div>
				<h1 class="text-ink mb-3 font-serif text-[30px] font-semibold lg:text-[38px]">
					{data.doc.meta.title}
				</h1>
				<p class="text-body max-w-[60ch] text-[17px] leading-relaxed">
					{data.doc.meta.description}
				</p>
				<!-- Page actions: edit the source, or take the page as Markdown to an assistant. -->
				<div
					class="text-body mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10.5px]"
				>
					<a
						href={editUrl}
						target="_blank"
						rel="noreferrer"
						class="hover:text-fx-accent no-underline transition-colors duration-[120ms]"
					>
						Edit this page ↗
					</a>
					<button
						type="button"
						class="hover:text-fx-accent transition-colors duration-[120ms]"
						onclick={copyMarkdown}
					>
						{copyState === 'copied'
							? 'Copied'
							: copyState === 'failed'
								? 'Copy blocked, open instead'
								: 'Copy as Markdown'}
					</button>
					<a
						href={markdownHref}
						target="_blank"
						rel="noopener"
						class="hover:text-fx-accent no-underline transition-colors duration-[120ms]"
					>
						Open Markdown ↗
					</a>
				</div>
			</div>
			{#if notApplicable}
				<Callout variant="warning" title="{appliesTo} only">
					This guide applies to the {appliesTo} adapter. The {framework.meta.label} adapter renders client-side
					only, so nothing here is needed there.
				</Callout>
			{/if}
			<PageComponent />
			{#if location && (location.prev || location.next)}
				<nav class="not-prose border-rule bg-card mt-14 grid grid-cols-2 border">
					{#if location.prev}
						<a
							href={location.prev.href}
							class="border-rule hover:text-fx-accent border-r p-5 no-underline transition-colors duration-[120ms]"
						>
							<span class="label text-faint block text-[10px]">← Previous</span>
							<span class="mt-1.5 block font-serif text-[16px] font-semibold"
								>{location.prev.title}</span
							>
						</a>
					{:else}
						<div class="border-rule border-r"></div>
					{/if}
					{#if location.next}
						<a
							href={location.next.href}
							class="hover:text-fx-accent p-5 text-right no-underline transition-colors duration-[120ms]"
						>
							<span class="label text-faint block text-[10px]">Next →</span>
							<span class="mt-1.5 block font-serif text-[16px] font-semibold"
								>{location.next.title}</span
							>
						</a>
					{/if}
				</nav>
			{/if}
		</article>
	</div>
	<aside class="border-rule hidden w-60 shrink-0 border-l xl:block">
		<div class="top-15 sticky flex flex-col gap-6 py-12 pl-6">
			<Toc />
		</div>
	</aside>
</div>
