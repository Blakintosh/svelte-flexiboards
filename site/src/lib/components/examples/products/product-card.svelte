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
		stock: number;
	};

	export type ProductCardProps = {
		product: Product;
		phone?: boolean;
	};
</script>

<script lang="ts">
	import { getFlexiwidgetCtx } from 'svelte-flexiboards';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Grabber from '$lib/components/examples/common/grabber.svelte';
	import Resizer from '$lib/components/examples/common/resizer.svelte';
	import Star from 'lucide-svelte/icons/star';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import Eye from 'lucide-svelte/icons/eye';
	import PencilLine from 'lucide-svelte/icons/pencil-line';
	import Copy from 'lucide-svelte/icons/copy';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import ShoppingCart from 'lucide-svelte/icons/shopping-cart';

	let { product, phone = false }: ProductCardProps = $props();

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

	function getStockStatus(stock: number): { label: string; class: string } {
		if (stock > 50) return { label: 'In Stock', class: 'text-emerald-600' };
		if (stock > 10) return { label: 'Low Stock', class: 'text-amber-600' };
		return { label: 'Limited', class: 'text-red-600' };
	}

	let stockStatus = $derived(getStockStatus(product.stock));
</script>

{#if phone}
	<!-- Phone: Full-width vertical card -->
	<Card.Root class="group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
		<!-- Image (top) -->
		<div class="relative h-28 shrink-0">
			<div class="absolute inset-0 bg-gradient-to-br {product.gradient}"></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<ShoppingCart class="size-12 text-white/20" />
			</div>
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute top-2 left-2">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
			<div class="absolute top-2 right-2 flex items-center gap-1">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button variant="ghost" size="icon" class="size-7 bg-black/20 text-white backdrop-blur-sm hover:bg-black/40" {...props}>
								<MoreVertical class="size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item><Eye class="mr-2 size-4" />View</DropdownMenu.Item>
						<DropdownMenu.Item><PencilLine class="mr-2 size-4" />Edit</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="text-destructive"><Trash2 class="mr-2 size-4" />Delete</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<Grabber size={14} class="text-white/70" />
			</div>
		</div>

		<!-- Content (bottom) -->
		<div class="flex min-h-0 flex-1 flex-col p-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<p class="text-muted-foreground text-xs uppercase tracking-wide">{product.category}</p>
					<span class="text-xs {stockStatus.class}">{stockStatus.label}</span>
				</div>
			</div>
			<h3 class="mt-1 text-base font-semibold leading-tight">{product.name}</h3>

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
					{product.rating} ({formatReviewCount(product.reviewCount)})
				</span>
			</div>

			<!-- Price -->
			<div class="mt-auto pt-2">
				<div class="flex items-baseline gap-2">
					<span class="text-xl font-bold">${product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="text-muted-foreground text-sm line-through">${product.originalPrice.toFixed(2)}</span>
						<Badge variant="secondary" class="text-xs">
							-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
						</Badge>
					{/if}
				</div>
			</div>
		</div>
	</Card.Root>
{:else if isWide}
	<!-- Wide card layout: horizontal -->
	<Card.Root class="group relative flex h-full flex-row overflow-hidden transition-shadow hover:shadow-md">
		<!-- Image placeholder (left) -->
		<div class="relative w-2/5 shrink-0">
			<div class="absolute inset-0 bg-gradient-to-br {product.gradient}"></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<ShoppingCart class="size-16 text-white/20" />
			</div>
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute top-3 left-3">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
			{#if product.featured}
				<div class="absolute top-3 right-3">
					<Badge variant="outline" class="border-white/30 bg-black/20 text-white backdrop-blur-sm">
						Featured
					</Badge>
				</div>
			{/if}
		</div>

		<!-- Content (right) -->
		<div class="flex flex-1 flex-col p-4">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">{product.category}</p>
						<span class="text-muted-foreground/50">·</span>
						<span class="text-xs {stockStatus.class}">{stockStatus.label}</span>
					</div>
					<h3 class="mt-1 truncate text-lg leading-tight font-semibold">{product.name}</h3>
				</div>
				<div class="flex items-center gap-1">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="ghost" size="icon" class="size-8 opacity-0 transition-opacity group-hover:opacity-100" {...props}>
									<MoreVertical class="size-4" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Item>
								<Eye class="mr-2 size-4" />
								View Details
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<PencilLine class="mr-2 size-4" />
								Edit Product
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<Copy class="mr-2 size-4" />
								Duplicate
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item class="text-destructive">
								<Trash2 class="mr-2 size-4" />
								Delete
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<Grabber size={18} class="text-muted-foreground shrink-0" />
				</div>
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
					{product.rating} ({product.reviewCount.toLocaleString()} reviews)
				</span>
			</div>

			<!-- Stock indicator -->
			<div class="mt-2 flex items-center gap-2">
				<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full transition-all {product.stock > 50
							? 'bg-emerald-500'
							: product.stock > 10
								? 'bg-amber-500'
								: 'bg-red-500'}"
						style="width: {Math.min(product.stock, 100)}%"
					></div>
				</div>
				<span class="text-muted-foreground text-xs">{product.stock} units</span>
			</div>

			<!-- Price & Actions -->
			<div class="mt-auto flex items-end justify-between pt-4">
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold">${product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="text-muted-foreground text-sm line-through">
							${product.originalPrice.toFixed(2)}
						</span>
						<Badge variant="secondary" class="text-xs">
							-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
						</Badge>
					{/if}
				</div>
				<Resizer size={16} class="text-muted-foreground" />
			</div>
		</div>
	</Card.Root>
{:else}
	<!-- Narrow card layout: vertical (tablet/desktop 1x1) -->
	<Card.Root class="group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
		<!-- Image placeholder (top) -->
		<div class="relative h-24 shrink-0 lg:h-28">
			<div class="absolute inset-0 bg-gradient-to-br {product.gradient}"></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<ShoppingCart class="size-10 text-white/20" />
			</div>
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute top-2 left-2">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
			<div class="absolute top-2 right-2 flex items-center gap-1">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								variant="ghost"
								size="icon"
								class="size-7 bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
								{...props}
							>
								<MoreVertical class="size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item>
							<Eye class="mr-2 size-4" />
							View
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<PencilLine class="mr-2 size-4" />
							Edit
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="text-destructive">
							<Trash2 class="mr-2 size-4" />
							Delete
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<Grabber size={14} class="text-white/70" />
			</div>
		</div>

		<!-- Content (bottom) -->
		<div class="flex min-h-0 flex-1 flex-col px-2.5 pt-1.5 pb-2">
			<div class="min-w-0">
				<div class="flex items-center gap-1.5">
					<p class="text-muted-foreground truncate text-[10px] uppercase tracking-wide">{product.category}</p>
					<span class="size-1.5 shrink-0 rounded-full {product.stock > 50 ? 'bg-emerald-500' : product.stock > 10 ? 'bg-amber-500' : 'bg-red-500'}"></span>
				</div>
				<h3 class="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</h3>
			</div>

			<!-- Rating -->
			<div class="mt-1.5 flex items-center gap-1">
				<Star class="size-3 fill-amber-400 text-amber-400" />
				<span class="text-xs font-medium">{product.rating}</span>
				<span class="text-muted-foreground text-xs">({formatReviewCount(product.reviewCount)})</span>
			</div>

			<!-- Price -->
			<div class="mt-auto flex items-end justify-between">
				<div class="flex items-baseline gap-1">
					<span class="text-base font-bold">${product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="text-muted-foreground text-[10px] line-through">
							${product.originalPrice.toFixed(2)}
						</span>
					{/if}
				</div>
				<Resizer size={14} class="text-muted-foreground" />
			</div>
		</div>
	</Card.Root>
{/if}
