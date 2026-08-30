<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		ResponsiveFlexiBoard,
		cssTransitionConfig,
		type FlexiBoardConfiguration,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import ProductCard, { type Product } from '$lib/components/examples/products/product-card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
		import { Input } from '$lib/components/ui/input/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Search from 'lucide-svelte/icons/search';
	import Plus from 'lucide-svelte/icons/plus';
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
	import Filter from 'lucide-svelte/icons/filter';

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
			featured: false,
			stock: 198
		}
	];

	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);
	let sortBy = $state<'name' | 'price' | 'rating'>('name');

	const categories = ['Audio', 'Accessories', 'Peripherals', 'Home Office'];

	const sortLabels: Record<typeof sortBy, string> = {
		name: 'Name ↓',
		price: 'Price ↓',
		rating: 'Rating ↓'
	};

	// Reflow on drag is a snap, not a glide: 160ms, no overshoot.
	const reflowTransition = (() => {
		const base = cssTransitionConfig();
		return {
			move: { ...base.move, duration: 160 },
			drop: { ...base.drop, duration: 160 },
			resize: { ...base.resize, duration: 160 }
		};
	})();

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

	// Anything provisional — the drop preview, the widget in hand — is dashed fx-accent.
	const className = (widget: FlexiWidgetController) => [
		widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent opacity-70',
		widget.isGrabbed && 'border border-fx-accent opacity-60'
	];
</script>

<main
	class="relative flex h-full min-h-0 w-full flex-col gap-4 bg-paper px-4 py-6 lg:gap-6 lg:px-12 lg:py-8"
>
	<!-- Header: title, count and the two board affordances in one mono line. -->
	<header class="flex shrink-0 items-center justify-between gap-3 border-b border-rule pb-3.5">
		<div class="flex min-w-0 items-baseline gap-3">
			<h1 class="font-serif text-xl leading-tight text-ink sm:text-2xl lg:text-[28px]">Products</h1>
			<p class="hidden font-mono text-[11px] text-faint sm:block">
				{filteredProducts().length} items · drag to curate · resize featured
			</p>
		</div>
		<Button size="sm" class="shrink-0">
			<Plus class="size-4 sm:mr-2" />
			<span class="hidden sm:inline">Add product</span>
		</Button>
	</header>

	<!-- Toolbar: one row — search, category, sort, and the status key it explains. -->
	<div class="flex shrink-0 flex-wrap items-center gap-2">
		<div class="relative min-w-0 flex-1 sm:max-w-[288px] sm:flex-none">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
			<Input
				type="search"
				placeholder="Search products…"
				class="pl-9 sm:w-[288px]"
				bind:value={searchQuery}
			/>
		</div>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<!-- Filter and sort read as labels, and say what they are set to. -->
					<Button variant="outline" size="sm" class="shrink-0 border-ink" {...props}>
						<Filter class="mr-2 size-3.5" />
						{selectedCategory ?? 'All categories'}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				<DropdownMenu.Item onclick={() => (selectedCategory = null)}>
					All categories
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
					<Button variant="outline" size="sm" class="shrink-0 text-body" {...props}>
						<ArrowUpDown class="mr-2 size-3.5" />
						{sortLabels[sortBy]}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				<DropdownMenu.Label>Sort by</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={() => (sortBy = 'name')}>Name</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => (sortBy = 'price')}>Price</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => (sortBy = 'rating')}>Rating</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		<!-- Status key: square ticks, one per state a card can show. -->
		<div class="ml-auto flex items-center gap-3 sm:gap-3.5">
			<span class="flex items-center gap-1.5 font-mono text-[11px] text-body">
				<span class="size-1.5 bg-blue"></span>In stock
			</span>
			<span class="flex items-center gap-1.5 font-mono text-[11px] text-faint">
				<span class="size-1.5 bg-faint"></span>Low
			</span>
			<span class="flex items-center gap-1.5 font-mono text-[11px] text-fx-accent">
				<span class="size-1.5 bg-fx-accent"></span>Limited
			</span>
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
							transition: reflowTransition
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
							transition: reflowTransition
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
							transition: reflowTransition
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
