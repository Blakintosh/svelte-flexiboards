<script lang="ts">
	import ThemeSelector from './theme-selector.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';

	import Menu from 'lucide-svelte/icons/menu';
	import FlexiMark from '$lib/components/brand/flexi-mark.svelte';
	import DocumentationSidebar from '../docs/documentation-sidebar.svelte';

	const version = 'v0.4';

	const nav = [
		{ label: 'Docs', href: '/docs', match: '/docs' },
		{ label: 'Examples', href: '/examples', match: '/examples' },
		{ label: 'API', href: '/docs/configuration', match: '/docs/configuration' }
	];

	let drawerOpen = $state(false);

	// The active item takes a 1px vermillion underline — never a fill.
	function isActive(match: string) {
		return match === '/docs'
			? page.url.pathname === '/docs' || page.url.pathname.startsWith('/docs/')
			: page.url.pathname.startsWith(match);
	}

	// Close drawer on navigation
	$effect(() => {
		page.url.pathname;
		drawerOpen = false;
	});
</script>

<header
	class="page-gutter sticky top-0 z-40 flex h-15 shrink-0 items-center justify-between border-b border-rule bg-paper/95 backdrop-blur-sm"
>
	<div class="flex items-center gap-8 lg:gap-11">
		<a class="flex items-center gap-3" href="/">
			<FlexiMark />
			<span class="font-serif text-[19px] font-semibold tracking-[-0.01em]">Flexiboards</span>
		</a>

		<nav class="hidden items-center gap-6 lg:flex">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					class={cn(
						'label border-b border-transparent pb-0.5 text-xs tracking-[0.1em] text-body transition-colors duration-[120ms] hover:text-vermillion',
						isActive(item.match) && 'border-vermillion text-ink'
					)}
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="hidden items-center gap-3.5 lg:flex">
		<span class="font-mono text-xs text-body">{version}</span>
		<Button href="https://github.com/blakintosh/svelte-flexiboards" variant="outline" size="sm" target="_blank">
			<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="size-3.5">
				<title>GitHub</title>
				<path
					d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
				/>
			</svg>
			Star
		</Button>
		<ThemeSelector />
	</div>

	<div class="flex items-center gap-1 lg:hidden">
		<span class="mr-2 font-mono text-xs text-body">{version}</span>
		<ThemeSelector />
		<Drawer.Root bind:open={drawerOpen}>
			<Drawer.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
				<Menu />
				<span class="sr-only">Open navigation</span>
			</Drawer.Trigger>
			<Drawer.Content>
				<ScrollArea class="h-[80svh]">
					<nav class="flex flex-col gap-6 px-6 pb-8 pt-2">
						<div class="flex flex-col">
							<h2 class="label mb-3 text-[10px] text-faint">Navigation</h2>
							<div class="flex flex-col border-t border-rule">
								<a
									href="/"
									class={cn(
										'label border-b border-rule py-3 text-xs tracking-[0.1em] text-body transition-colors duration-[120ms] hover:text-vermillion',
										page.url.pathname === '/' && 'text-vermillion'
									)}
								>
									Home
								</a>
								{#each nav as item (item.href)}
									<a
										href={item.href}
										class={cn(
											'label border-b border-rule py-3 text-xs tracking-[0.1em] text-body transition-colors duration-[120ms] hover:text-vermillion',
											isActive(item.match) && 'text-vermillion'
										)}
									>
										{item.label}
									</a>
								{/each}
							</div>
						</div>

						<DocumentationSidebar />

						<div class="border-t border-rule pt-6">
							<Button
								href="https://github.com/blakintosh/svelte-flexiboards"
								variant="outline"
								size="sm"
								target="_blank"
							>
								<svg
									role="img"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									class="size-3.5"
								>
									<title>GitHub</title>
									<path
										d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
									/>
								</svg>
								Star on GitHub
							</Button>
						</div>
					</nav>
				</ScrollArea>
			</Drawer.Content>
		</Drawer.Root>
	</div>
</header>
