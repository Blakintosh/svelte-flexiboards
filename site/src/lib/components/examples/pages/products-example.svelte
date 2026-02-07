<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		ResponsiveFlexiBoard,
		simpleTransitionConfig,
		type FlexiBoardConfiguration,
		type FlexiWidgetController
	} from 'svelte-flexiboards';
	import ProductCard, { type Product } from '$lib/components/examples/products/product-card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Search from 'lucide-svelte/icons/search';
	import Plus from 'lucide-svelte/icons/plus';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import Filter from 'lucide-svelte/icons/filter';
	import Package from 'lucide-svelte/icons/package';

	const products: Product[] = [
		{
			id: 'prod-1',
			name: 'Premium Wireless Headphones',
			price: 199.99,
			originalPrice: 249.99,
			rating: 4.8,
			reviewCount: 2341,
			badge: 'sale',
			category: 'Audio',
			gradient: 'from-violet-500 to-purple-600',
			featured: true,
			stock: 45
		},
		{
			id: 'prod-2',
			name: 'Minimalist Watch',
			price: 149.0,
			rating: 4.5,
			reviewCount: 892,
			badge: 'new',
			category: 'Accessories',
			gradient: 'from-slate-400 to-slate-600',
			featured: false,
			stock: 23
		},
		{
			id: 'prod-3',
			name: 'Smart Speaker',
			price: 79.99,
			rating: 4.3,
			reviewCount: 1567,
			category: 'Audio',
			gradient: 'from-emerald-400 to-teal-600',
			featured: false,
			stock: 156
		},
		{
			id: 'prod-4',
			name: 'Ergonomic Keyboard',
			price: 129.0,
			rating: 4.7,
			reviewCount: 743,
			badge: 'bestseller',
			category: 'Peripherals',
			gradient: 'from-amber-400 to-orange-500',
			featured: true,
			stock: 89
		},
		{
			id: 'prod-5',
			name: 'Portable Charger',
			price: 39.99,
			rating: 4.4,
			reviewCount: 3201,
			category: 'Accessories',
			gradient: 'from-blue-400 to-cyan-500',
			featured: false,
			stock: 412
		},
		{
			id: 'prod-6',
			name: 'Wireless Earbuds',
			price: 89.99,
			originalPrice: 119.99,
			rating: 4.6,
			reviewCount: 1823,
			badge: 'sale',
			category: 'Audio',
			gradient: 'from-pink-400 to-rose-500',
			featured: false,
			stock: 67
		},
		{
			id: 'prod-7',
			name: 'Desk Lamp Pro',
			price: 59.0,
			rating: 4.2,
			reviewCount: 456,
			badge: 'new',
			category: 'Home Office',
			gradient: 'from-yellow-300 to-amber-400',
			featured: false,
			stock: 34
		},
		{
			id: 'prod-8',
			name: 'USB-C Hub',
			price: 49.99,
			rating: 4.5,
			reviewCount: 2104,
			category: 'Peripherals',
			gradient: 'from-gray-400 to-zinc-600',
			featured: false,
			stock: 198
		}
	];

	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);
	let sortBy = $state<'name' | 'price' | 'rating'>('name');

	const categories = ['Audio', 'Accessories', 'Peripherals', 'Home Office'];

	let filteredProducts = $derived(() => {
		let result = products;
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
			);
		}
		if (selectedCategory) {
			result = result.filter((p) => p.category === selectedCategory);
		}
		return result;
	});

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggability: 'full',
			resizability: 'horizontal'
		}
	});

	const className = (widget: FlexiWidgetController) => [
		widget.isShadow && 'opacity-50',
		widget.isGrabbed && 'animate-pulse opacity-50'
	];
</script>

<main
	class="relative flex h-full min-h-0 w-full flex-col gap-4 px-4 py-6 lg:gap-6 lg:px-12 lg:py-8"
>
	<!-- Header -->
	<header class="shrink-0">
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-2 sm:gap-3">
				<div class="bg-primary/10 hidden size-10 items-center justify-center rounded-lg sm:flex">
					<Package class="text-primary size-5" />
				</div>
				<div>
					<h1 class="text-xl font-semibold sm:text-2xl lg:text-3xl">Products</h1>
					<p class="text-muted-foreground hidden text-sm sm:block">Manage your product catalog</p>
				</div>
			</div>
			<Button size="sm" class="shrink-0">
				<Plus class="size-4 sm:mr-2" />
				<span class="hidden sm:inline">Add Product</span>
			</Button>
		</div>
	</header>

	<!-- Toolbar -->
	<div class="flex shrink-0 flex-col gap-2 sm:gap-3">
		<div class="flex items-center gap-2">
			<div class="relative min-w-0 flex-1 sm:max-w-xs">
				<Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				<Input type="search" placeholder="Search..." class="pl-9" bind:value={searchQuery} />
			</div>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="icon" class="shrink-0 sm:hidden" {...props}>
							<Filter class="size-4" />
						</Button>
						<Button variant="outline" size="sm" class="hidden shrink-0 sm:flex" {...props}>
							<Filter class="mr-2 size-4" />
							{selectedCategory ?? 'All'}
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Item onclick={() => (selectedCategory = null)}>
						All Categories
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					{#each categories as category}
						<DropdownMenu.Item onclick={() => (selectedCategory = category)}>
							{category}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="icon" class="shrink-0" {...props}>
							<ArrowUpDown class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Label>Sort by</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onclick={() => (sortBy = 'name')}>Name</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => (sortBy = 'price')}>Price</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => (sortBy = 'rating')}>Rating</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>

		<div class="flex items-center justify-between text-xs sm:text-sm">
			<span class="text-muted-foreground">
				{filteredProducts().length} products
			</span>
			<div class="flex items-center gap-1.5 sm:gap-2">
				<Badge
					variant="secondary"
					class="gap-1 px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-0.5 sm:text-xs"
				>
					<span class="size-1.5 rounded-full bg-emerald-500 sm:size-2"></span>
					In Stock
				</Badge>
				<Badge
					variant="outline"
					class="gap-1 px-1.5 py-0.5 text-[10px] text-amber-600 sm:px-2 sm:py-0.5 sm:text-xs"
				>
					<span class="size-1.5 rounded-full bg-amber-500 sm:size-2"></span>
					Low
				</Badge>
			</div>
		</div>
	</div>

	<!-- Board -->
	<ResponsiveFlexiBoard
		config={{
			breakpoints: {
				lg: 1024,
				sm: 640
			}
		}}
	>
		<!-- Desktop: 3 columns -->
		{#snippet lg()}
			<FlexiBoard class="min-h-0 flex-1 overflow-x-clip overflow-y-auto" config={boardConfig}>
				<FlexiTarget
					key="products"
					class="gap-4 p-1"
					config={{
						rowSizing: 'minmax(0, 260px)',
						layout: {
							type: 'flow',
							flowAxis: 'row',
							placementStrategy: 'append',
							rows: 4,
							columns: 3
						},
						widgetDefaults: {
							transition: simpleTransitionConfig()
						}
					}}
				>
					{#each filteredProducts() as product (product.id)}
						<FlexiWidget
							class={className}
							component={ProductCard}
							componentProps={{ product }}
							width={product.featured ? 2 : 1}
							minWidth={1}
							maxWidth={2}
						/>
					{/each}
				</FlexiTarget>
			</FlexiBoard>
		{/snippet}

		<!-- Tablet: 2 columns -->
		{#snippet sm()}
			<FlexiBoard
				class="products-board min-h-0 flex-1 overflow-x-clip overflow-y-auto"
				config={boardConfig}
			>
				<FlexiTarget
					key="products"
					class="gap-3 p-0.5"
					config={{
						rowSizing: 'minmax(0, 240px)',
						layout: {
							type: 'flow',
							flowAxis: 'row',
							placementStrategy: 'append',
							rows: 5,
							columns: 2
						},
						widgetDefaults: {
							transition: simpleTransitionConfig()
						}
					}}
				>
					{#each filteredProducts() as product (product.id)}
						<FlexiWidget
							class={className}
							component={ProductCard}
							componentProps={{ product }}
							width={product.featured ? 2 : 1}
							minWidth={1}
							maxWidth={2}
						/>
					{/each}
				</FlexiTarget>
			</FlexiBoard>
		{/snippet}

		<!-- Phone: 1 column, full vertical cards -->
		{#snippet children()}
			<FlexiBoard
				class="products-board min-h-0 flex-1 overflow-x-clip overflow-y-auto"
				config={boardConfig}
			>
				<FlexiTarget
					key="products"
					class="gap-3 p-1"
					config={{
						rowSizing: 'minmax(0, 280px)',
						layout: {
							type: 'flow',
							flowAxis: 'row',
							placementStrategy: 'append',
							rows: 4,
							columns: 1
						},
						widgetDefaults: {
							transition: simpleTransitionConfig()
						}
					}}
				>
					{#each filteredProducts() as product (product.id)}
						<FlexiWidget
							class={className}
							component={ProductCard}
							componentProps={{ product, phone: true }}
							width={1}
							minWidth={1}
							maxWidth={1}
						/>
					{/each}
				</FlexiTarget>
			</FlexiBoard>
		{/snippet}
	</ResponsiveFlexiBoard>
</main>
