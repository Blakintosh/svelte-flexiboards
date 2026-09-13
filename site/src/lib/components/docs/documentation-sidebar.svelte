<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/state';
	import { directoryFor } from '$lib/docs-directory';
	import { framework } from '$lib/components/brand/framework.svelte';
	import FrameworkMenu from '$lib/components/brand/framework-menu.svelte';

	let { class: className = '' } = $props();

	// The contents follow the framework choice; numbering closes up around omitted pages.
	const directory = $derived(directoryFor(framework.current));
	const pageCount = $derived(directory.reduce((n, s) => n + s.pages.length, 0));
</script>

<!--
  Drafting-table contents: numbered section labels, items ruled off by a left
  border, and the active page flagged with a fx-accent square in the margin.
-->
<nav aria-label="Documentation" class={cn('flex min-h-0 flex-col', className)}>
	<!-- Framework first: it decides which pages exist below. -->
	<FrameworkMenu align="left" class="mb-5 w-full justify-between" />

	<div class="label text-faint mb-4 flex items-center gap-2 text-[10px]">
		<span>Contents</span>
		<div class="bg-rule h-px flex-1"></div>
		<span>{pageCount} pages</span>
	</div>

	{#each directory as section, i}
		<div class={cn('flex flex-col', i > 0 && 'mt-6')}>
			<h2 class="label mb-2 flex items-center gap-2.5 text-[10px]">
				<span class="text-faint">{String(i + 1).padStart(2, '0')}</span>
				<span class="text-ink-hover">{section.section}</span>
				{#if section.preview}
					<span class="border-rule text-body border px-1.5 py-0.5 text-[9px] tracking-[0.04em]"
						>Preview</span
					>
				{/if}
			</h2>
			<div class="border-rule ml-0.5 flex flex-col border-l pl-3">
				{#each section.pages as docPage}
					{@const isActive = docPage.href === page.url.pathname}
					{#if docPage.separatorBefore}<hr class="border-rule my-2 border-t" />{/if}
					<a
						href={docPage.href}
						aria-current={isActive ? 'page' : undefined}
						class={cn(
							'relative py-1.5 font-sans text-sm leading-snug no-underline transition-colors duration-[120ms]',
							isActive ? 'text-fx-accent' : 'text-body hover:text-ink'
						)}
					>
						{#if isActive}
							<span class="bg-fx-accent absolute -left-[15.5px] top-1/2 size-[5px] -translate-y-1/2"
							></span>
						{/if}
						<span class="block truncate">{docPage.title}</span>
					</a>
				{/each}
			</div>
		</div>
	{/each}
</nav>
