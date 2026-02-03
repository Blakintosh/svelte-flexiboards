<script module lang="ts">
	export type ProductBadge = 'sale' | 'new' | 'bestseller';

	export type Product = {
		id: string;
		name: string;
		price: number;
		originalPrice?: number;
		rating: number;
		reviewCount: number;
		badge?: ProductBadge;
		category: string;
		gradient: string;
		featured: boolean;
	};

	export type ProductCardProps = {
		product: Product;
	};
</script>

<script lang="ts">
	import { getFlexiwidgetCtx } from 'svelte-flexiboards';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import Grabber from '$lib/components/examples/common/grabber.svelte';
	import Resizer from '$lib/components/examples/common/resizer.svelte';
	import Star from 'lucide-svelte/icons/star';

	let { product }: ProductCardProps = $props();

	const widget = getFlexiwidgetCtx();

	let isWide = $derived(widget.width > 1);

	const badgeVariants: Record<
		ProductBadge,
		{ variant: 'default' | 'secondary' | 'destructive'; label: string }
	> = {
		sale: { variant: 'destructive', label: 'Sale' },
		new: { variant: 'default', label: 'New' },
		bestseller: { variant: 'secondary', label: 'Bestseller' }
	};

	function formatReviewCount(count: number): string {
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`;
		}
		return count.toString();
	}
</script>

{#if isWide}
	<!-- Wide card layout: horizontal -->
	<Card.Root class="relative flex h-full flex-row overflow-hidden">
		<!-- Image placeholder (left) -->
		<div class="relative w-1/2 shrink-0">
			<div class="absolute inset-0 bg-gradient-to-br {product.gradient}"></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-6xl opacity-20">📦</span>
			</div>
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute top-3 left-3">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
		</div>

		<!-- Content (right) -->
		<div class="flex flex-1 flex-col p-4">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<p class="text-muted-foreground text-xs">{product.category}</p>
					<h3 class="mt-1 truncate text-lg leading-tight font-semibold">{product.name}</h3>
				</div>
				<Grabber size={18} class="text-muted-foreground shrink-0" />
			</div>

			<!-- Rating -->
			<div class="mt-2 flex items-center gap-1">
				{#each Array(5) as _, i}
					<Star
						class="size-4 {i < Math.round(product.rating)
							? 'fill-amber-400 text-amber-400'
							: 'text-muted-foreground/30'}"
					/>
				{/each}
				<span class="text-muted-foreground ml-1 text-xs">
					({product.reviewCount.toLocaleString()})
				</span>
			</div>

			<!-- Price -->
			<div class="mt-auto pt-4">
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold">${product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="text-muted-foreground text-sm line-through">
							${product.originalPrice.toFixed(2)}
						</span>
					{/if}
				</div>
			</div>

			<Resizer size={16} class="text-muted-foreground absolute right-2 bottom-2" />
		</div>
	</Card.Root>
{:else}
	<!-- Narrow card layout: vertical -->
	<Card.Root class="relative flex h-full flex-col overflow-hidden">
		<!-- Image placeholder (top) -->
		<div class="relative h-28 shrink-0 lg:h-32">
			<div class="absolute inset-0 bg-gradient-to-br {product.gradient}"></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-4xl opacity-20">📦</span>
			</div>
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute top-2 left-2 text-xs">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
		</div>

		<!-- Content (bottom) -->
		<div class="flex flex-1 flex-col p-3">
			<div class="flex items-start justify-between gap-1">
				<div class="min-w-0 flex-1">
					<p class="text-muted-foreground text-xs">{product.category}</p>
					<h3 class="mt-0.5 line-clamp-2 text-sm leading-tight font-semibold">{product.name}</h3>
				</div>
				<Grabber size={16} class="text-muted-foreground shrink-0" />
			</div>

			<!-- Rating (compact) -->
			<div class="mt-1.5 flex items-center gap-1">
				<Star class="size-3 fill-amber-400 text-amber-400" />
				<span class="text-xs font-medium">{product.rating}</span>
				<span class="text-muted-foreground text-xs">({formatReviewCount(product.reviewCount)})</span
				>
			</div>

			<!-- Price -->
			<div class="mt-auto pt-2">
				<div class="flex items-baseline gap-1.5">
					<span class="text-lg font-bold">${product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="text-muted-foreground text-xs line-through">
							${product.originalPrice.toFixed(2)}
						</span>
					{/if}
				</div>
			</div>

			<Resizer size={14} class="text-muted-foreground absolute right-1.5 bottom-1.5" />
		</div>
	</Card.Root>
{/if}
