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
	import type { FlexiBoardSuspenseReason } from '@flexiboards/svelte';
	import BoardSkeleton from '$lib/components/examples/common/board-skeleton.svelte';
	import ProductCard, { type Product } from '$lib/components/examples/products/product-card.svelte';
	import Button from '$lib/components/examples/common/button.svelte';
	import { fieldClass, selectClass } from '$lib/components/examples/common/button-classes.js';
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
	// '' is "All categories" — a native <select> option can't carry null.
	let selectedCategory = $state('');
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

	// The drop preview is dashed fx-accent; the widget in hand lifts instead —
	// shadow-lift and a slight tilt, no border.
	const className = (widget: FlexiWidgetController) => [
		'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
		widget.isShadow &&
			'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'rounded-[14px] shadow-lift rotate-[2.5deg] opacity-95'
	];
</script>

<main
	class="bg-paper relative flex h-full min-h-0 w-full flex-col gap-4 px-4 py-6 lg:gap-6 lg:px-12 lg:py-8"
>
	<!-- Header: title, count and the two board affordances in one mono line. -->
	<header class="border-rule-soft flex shrink-0 items-center justify-between gap-3 border-b pb-3.5">
		<div class="flex min-w-0 items-baseline gap-3">
			<h1 class="text-ink font-serif text-xl leading-tight sm:text-2xl lg:text-[28px]">Products</h1>
			<p class="text-faint hidden font-mono text-[11px] sm:block">
				{filteredProducts().length} items · drag to curate · resize featured
			</p>
		</div>
		<Button size="sm" class="shrink-0 rounded-full">
			<Plus class="size-4 sm:mr-2" />
			<span class="hidden sm:inline">Add product</span>
		</Button>
	</header>

	<!-- Toolbar: one row — search, category, sort, and the status key it explains. -->
	<div class="flex shrink-0 flex-wrap items-center gap-2">
		<div class="relative min-w-0 flex-1 sm:max-w-[288px] sm:flex-none">
			<Search class="text-faint absolute left-3 top-1/2 size-4 -translate-y-1/2" />
			<input
				type="search"
				placeholder="Search products…"
				aria-label="Search products"
				class="{fieldClass} rounded-full pl-9 sm:w-[288px]"
				bind:value={searchQuery}
			/>
		</div>

		<!-- Filter and sort are choices, so they are native selects: they say what
			they are set to, and the platform draws the list. -->
		<div class="relative shrink-0">
			<Filter
				class="text-faint pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2"
			/>
			<select
				class="{selectClass} border-rule-soft h-9 w-auto rounded-full pl-8"
				aria-label="Filter by category"
				bind:value={selectedCategory}
			>
				<option value="">All categories</option>
				{#each categories as category (category)}
					<option value={category}>{category}</option>
				{/each}
			</select>
		</div>

		<div class="relative shrink-0">
			<ArrowUpDown
				class="text-faint pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2"
			/>
			<select
				class="{selectClass} text-body border-rule-soft h-9 w-auto rounded-full pl-8"
				aria-label="Sort by"
				bind:value={sortBy}
			>
				<option value="name">{sortLabels.name}</option>
				<option value="price">{sortLabels.price}</option>
				<option value="rating">{sortLabels.rating}</option>
			</select>
		</div>

		<!-- Status key: soft dots, one per state a card can show. -->
		<div class="ml-auto flex items-center gap-3 sm:gap-3.5">
			<span class="text-body flex items-center gap-1.5 font-mono text-[11px]">
				<span class="bg-blue size-1.5 rounded-full"></span>In stock
			</span>
			<span class="text-faint flex items-center gap-1.5 font-mono text-[11px]">
				<span class="bg-faint size-1.5 rounded-full"></span>Low
			</span>
			<span class="text-fx-accent flex items-center gap-1.5 font-mono text-[11px]">
				<span class="bg-fx-accent size-1.5 rounded-full"></span>Limited
			</span>
		</div>
	</div>
	<!-- Board -->
	<ResponsiveFlexiBoard
		config={{
			breakpoints: {
				lg: 1024,
				sm: 640
			},
			// SSR can't match a media query; render the desktop board so widget
			// sizes are right for most first paints (see launcher).
			ssrBreakpoint: 'lg'
		}}
	>
		<!-- Desktop: 3 columns -->
		{#snippet lg()}
			<FlexiBoard class="min-h-0 flex-1 overflow-y-auto overflow-x-clip" config={boardConfig}>
				{#snippet suspense(_: FlexiBoardSuspenseReason)}
					<BoardSkeleton bars={4} class="p-1" />
				{/snippet}
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
				class="products-board min-h-0 flex-1 overflow-y-auto overflow-x-clip"
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
				class="products-board min-h-0 flex-1 overflow-y-auto overflow-x-clip"
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
