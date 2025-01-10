<script>
	import ThemeSelector from './theme-selector.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import Menu from 'lucide-svelte/icons/menu';
	import DocumentationSidebar from '../docs/documentation-sidebar.svelte';
</script>

<header class="flex items-center justify-between border-b px-8 py-2">
	<div class="flex w-[80%] items-center gap-16">
		<a class="flex items-center justify-start gap-4" href="/">
			<div class="flex flex-col items-start gap-[0.075rem]">
				<div class="h-1 w-[1rem] rounded-[1px] bg-orange-500"></div>
				<div class="h-1 w-[0.67rem] rounded-[1px] bg-orange-500"></div>
				<div class="h-1 w-[0.33rem] rounded-[1px] bg-orange-500"></div>
			</div>
			<h1 class="font-display text-2xl font-medium">Flexiboards</h1>
		</a>

		<ul class="hidden items-center gap-2 lg:flex">
			<li>
				<Button href="/docs" variant={'ghost'}>Docs</Button>
			</li>
			<li>
				<Button href="/examples" variant={'ghost'}>Examples</Button>
			</li>
		</ul>
	</div>

	<div class="hidden w-[20%] items-center justify-end gap-1 lg:flex">
		<Button
			href="https://github.com/blakintosh/svelte-flexiboards"
			variant="ghost"
			size="icon"
			target="_blank"
		>
			<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
				<title>GitHub</title>
				<path
					d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
				/>
			</svg>
			<span class="sr-only">GitHub</span>
		</Button>
		<ThemeSelector />
	</div>
	<div class="flex w-[20%] items-center justify-end gap-1 lg:hidden">
		<Popover.Root>
			<Popover.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon' })}>
				<Menu />
			</Popover.Trigger>
			<Popover.Content class="w-64">
				<div class="flex items-center gap-2 px-2">
					<Button
						href="https://github.com/blakintosh/svelte-flexiboards"
						variant="ghost"
						size="icon"
						target="_blank"
					>
						<svg
							role="img"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
							fill="currentColor"
						>
							<title>GitHub</title>
							<path
								d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
							/>
						</svg>
						<span class="sr-only">GitHub</span>
					</Button>
					<ThemeSelector />
				</div>
				<ul class="flex min-h-0 w-full flex-col items-stretch gap-2">
					<li>
						<Button
							href="/"
							variant={'ghost'}
							class="w-full justify-start text-base font-normal text-muted-foreground">Home</Button
						>
					</li>
				</ul>

				<div class="flex flex-col gap-2 px-4 py-2">
					<DocumentationSidebar />
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
</header>
