<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/state';
	import { directoryFor } from '$lib/docs-directory';
	import { framework } from '$lib/components/brand/framework.svelte';
	import FrameworkMenu from '$lib/components/brand/framework-menu.svelte';

	let { class: className = '' } = $props();

	// The contents follow the framework choice: pages that don't apply (e.g.
	// SSR under React) drop out, and the numbering closes up around them.
	const directory = $derived(directoryFor(framework.current));
	const pageCount = $derived(directory.reduce((n, s) => n + s.pages.length, 0));
</script>

<!--
  Drafting-table contents: numbered section labels, items ruled off by a left
  border, and the active page flagged with a fx-accent square in the margin.
-->
<nav class={cn('flex min-h-0 flex-col', className)}>
	<!-- Framework first: it decides which pages exist below. -->
	<FrameworkMenu align="left" class="mb-5 w-full justify-between" />

	<div class="mb-4 flex items-center gap-2 text-[10px] label text-faint">
		<span>Contents</span>
		<div class="h-px flex-1 bg-rule"></div>
		<span>{pageCount} pages</span>
	</div>

	{#each directory as section, i}
		<div class={cn('flex flex-col', i > 0 && 'mt-6')}>
			<h2 class="mb-2 flex gap-2.5 text-[10px] label">
				<span class="text-faint">{String(i + 1).padStart(2, '0')}</span>
				<span class="text-ink-hover">{section.section}</span>
			</h2>
			<div class="ml-0.5 flex flex-col border-l border-rule pl-3">
				{#each section.pages as docPage}
					{@const isActive = docPage.href === page.url.pathname}
					<a
						href={docPage.href}
						aria-current={isActive ? 'page' : undefined}
						class={cn(
							'relative py-1.5 font-mono text-[12.5px] leading-snug no-underline transition-colors duration-[120ms]',
							isActive ? 'text-fx-accent' : 'text-body hover:text-ink'
						)}
					>
						{#if isActive}
							<span class="absolute -left-[15.5px] top-1/2 size-[5px] -translate-y-1/2 bg-fx-accent"
							></span>
						{/if}
						<span class="block truncate">{docPage.title}</span>
					</a>
				{/each}
			</div>
		</div>
	{/each}
</nav>
