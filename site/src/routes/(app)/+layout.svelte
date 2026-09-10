<script lang="ts">
	import Header from '$lib/components/nav/header.svelte';
	import FlexiMark from '$lib/components/brand/flexi-mark.svelte';
	import { page } from '$app/state';
	import { framework } from '$lib/components/brand/framework.svelte';

	let { children } = $props();

	// The splash runs edge to edge — its sections supply their own gutters so the
	// 1px rules between them can reach the viewport edge.
	const fullBleed = $derived(page.url.pathname === '/');
	// The header and footer gutters read --page-max. The examples viewer runs
	// wider (sidebar + stage + features rail) and the docs' three columns span
	// the whole viewport, so match the chrome to each route's measure.
	const pageMax = $derived(
		page.url.pathname.startsWith('/docs')
			? '100%'
			: page.url.pathname.startsWith('/examples')
				? '100rem'
				: undefined
	);

	const footerColumns = $derived([
		{
			heading: 'Docs',
			links: [
				{ label: 'Overview', href: '/docs/overview' },
				{ label: 'Free-form grids', href: '/docs/free-form-grids' },
				{ label: 'Flow grids', href: '/docs/flow-grids' },
				{ label: 'Configuration', href: '/docs/configuration' },
				{ label: 'Transitions', href: '/docs/transitions' }
			]
		},
		{
			heading: 'Components',
			links: [
				{ label: 'FlexiBoard', href: '/docs/components/board' },
				{ label: 'FlexiTarget', href: '/docs/components/target' },
				{ label: 'FlexiWidget', href: '/docs/components/widget' },
				{ label: 'FlexiAdd', href: '/docs/components/adder' },
				{ label: 'Responsive board', href: '/docs/components/responsive-board' }
			]
		},
		{
			heading: 'Project',
			links: [
				{ label: 'GitHub', href: 'https://github.com/Blakintosh/svelte-flexiboards' },
				// Follows the framework picker: the npm page for the adapter in use.
				{ label: 'npm', href: `https://www.npmjs.com/package/${framework.meta.package}` },
				{ label: 'Examples', href: '/examples' }
			]
		}
	]);
</script>

<div class="flex min-h-svh flex-col" style:--page-max={pageMax}>
	<Header />

	<main class="flex min-h-0 flex-1 flex-col {fullBleed ? '' : 'px-4 lg:px-8'}" id="main-content">
		{@render children()}
	</main>

	<footer class="border-t border-rule bg-paper">
		<div
			class="page-gutter grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-8 py-12 text-[13.5px] text-body"
		>
			<div>
				<div class="mb-2.5 flex items-center gap-2.5">
					<FlexiMark />
					<span class="font-serif text-base text-ink">Flexiboards</span>
				</div>
				<p class="m-0 max-w-[34ch] leading-relaxed">
					A headless drag-and-drop grids library. We'll bring the grid, you bring the style.
				</p>
			</div>

			{#each footerColumns as column (column.heading)}
				<div>
					<b class="label mb-2.5 block text-[11px] tracking-[0.12em] text-faint">
						{column.heading}
					</b>
					<div class="flex flex-col gap-1.5">
						{#each column.links as link (link.href)}
							<a
								href={link.href}
								class="w-fit transition-colors duration-[120ms] hover:text-fx-accent"
								target={link.href.startsWith('http') ? '_blank' : undefined}
							>
								{link.label}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div
			class="page-gutter label flex flex-wrap items-center justify-between gap-3 border-t border-rule py-4 text-[10px] text-faint"
		>
			<span>MIT licensed</span>
			<span class="normal-case tracking-normal">
				Made by <a
					href="https://github.com/Blakintosh"
					class="text-body transition-colors duration-[120ms] hover:text-fx-accent"
					target="_blank">Blakintosh</a
				>
			</span>
		</div>
	</footer>
</div>
