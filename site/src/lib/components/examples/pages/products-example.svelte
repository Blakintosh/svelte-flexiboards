<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiBoardConfiguration,
		type FlexiBoardController,
		type FlexiWidgetController
	} from 'svelte-flexiboards';
	import ProductCard, { type Product } from '$lib/components/examples/products/product-card.svelte';

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
			featured: true
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
			featured: false
		},
		{
			id: 'prod-3',
			name: 'Smart Speaker',
			price: 79.99,
			rating: 4.3,
			reviewCount: 1567,
			category: 'Audio',
			gradient: 'from-emerald-400 to-teal-600',
			featured: false
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
			featured: true
		},
		{
			id: 'prod-5',
			name: 'Portable Charger',
			price: 39.99,
			rating: 4.4,
			reviewCount: 3201,
			category: 'Accessories',
			gradient: 'from-blue-400 to-cyan-500',
			featured: false
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
			featured: false
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
			featured: false
		},
		{
			id: 'prod-8',
			name: 'USB-C Hub',
			price: 49.99,
			rating: 4.5,
			reviewCount: 2104,
			category: 'Peripherals',
			gradient: 'from-gray-400 to-zinc-600',
			featured: false
		}
	];

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true,
			resizability: 'horizontal'
		}
	});

	const className = (widget: FlexiWidgetController) => [
		widget.isShadow && 'opacity-50',
		widget.isGrabbed && 'animate-pulse opacity-60'
	];

	let boardController: FlexiBoardController = $state() as FlexiBoardController;
</script>

<main class="flex h-full min-h-0 w-full flex-col gap-6 px-4 py-6 lg:px-12 lg:py-8">
	<header class="shrink-0">
		<h1 class="text-2xl font-semibold lg:text-3xl">Products.</h1>
		<p class="text-muted-foreground mt-1 text-sm lg:text-base">
			Drag to reorder. Resize horizontally to feature products.
		</p>
	</header>

	<FlexiBoard
		class="min-h-0 flex-1 overflow-auto"
		config={boardConfig}
		bind:controller={boardController}
	>
		<FlexiTarget
			key="products"
			class="gap-3 p-1 lg:gap-4"
			config={{
				rowSizing: 'minmax(0, 240px)',
				layout: {
					type: 'flow',
					flowAxis: 'row',
					placementStrategy: 'append',
					rows: 4,
					columns: 3
				}
			}}
		>
			{#each products as product (product.id)}
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
</main>
