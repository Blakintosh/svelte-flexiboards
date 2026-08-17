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

	// Fills mean shipped, so a live promotion is the only accent here.
	const badgeVariants: Record<
		ProductBadge,
		{ variant: 'default' | 'secondary' | 'accent'; label: string }
	> = {
		sale: { variant: 'accent', label: 'Sale' },
		new: { variant: 'default', label: 'New' },
		bestseller: { variant: 'secondary', label: 'Bestseller' }
	};

	// Card frames are 1px rules that firm up on hover — never a shadow or a lift.
	const cardClass = 'group relative flex h-full overflow-hidden border-rule bg-panel shadow-none transition-colors duration-[120ms] hover:border-ink';

	function formatReviewCount(count: number): string {
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`;
		}
		return count.toString();
	}

	function getStockStatus(stock: number): { label: string; class: string; bar: string } {
		if (stock > 50) return { label: 'In stock', class: 'text-blue', bar: 'bg-blue' };
		if (stock > 10) return { label: 'Low stock', class: 'text-body', bar: 'bg-faint' };
		return { label: 'Limited', class: 'text-vermillion', bar: 'bg-vermillion' };
	}

	let stockStatus = $derived(getStockStatus(product.stock));
</script>

<!-- Thumbnails are drafting placeholders — a graph-paper cell, never stock imagery. -->
{#snippet thumbnail(iconSize: string)}
	<div class="graph-paper absolute inset-0 bg-tint"></div>
	<div class="absolute inset-0 flex items-center justify-center">
		<ShoppingCart class="{iconSize} text-faint" />
	</div>
{/snippet}

{#snippet rating(compact: boolean)}
	{#if compact}
		<div class="mt-1.5 flex items-center gap-1">
			<Star class="size-3 fill-ink text-ink" />
			<span class="font-mono text-[11px] text-ink">{product.rating}</span>
			<span class="font-mono text-[11px] text-faint">({formatReviewCount(product.reviewCount)})</span>
		</div>
	{:else}
		<div class="mt-2 flex items-center gap-1">
			{#each Array(5) as _, i}
				<Star class="size-4 {i < Math.round(product.rating) ? 'fill-ink text-ink' : 'text-rule'}" />
			{/each}
			<span class="ml-1 font-mono text-[11px] text-faint">
				{product.rating} ({formatReviewCount(product.reviewCount)})
			</span>
		</div>
	{/if}
{/snippet}

{#snippet controls()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button variant="ghost" size="icon" class="size-7" {...props}>
					<MoreVertical class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item><Eye class="mr-2 size-4" />View</DropdownMenu.Item>
			<DropdownMenu.Item><PencilLine class="mr-2 size-4" />Edit</DropdownMenu.Item>
			{#if isWide}
				<DropdownMenu.Item><Copy class="mr-2 size-4" />Duplicate</DropdownMenu.Item>
			{/if}
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="text-vermillion">
				<Trash2 class="mr-2 size-4" />Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#if phone}
	<!-- Phone: Full-width vertical card -->
	<Card.Root class="{cardClass} flex-col">
		<!-- Grab handle - top left -->
		<div class="absolute top-2 left-2 z-10">
			<Grabber size={16} class="bg-paper" />
		</div>

		<!-- Controls - top right -->
		<div class="absolute top-2 right-2 z-10 bg-paper">
			{@render controls()}
		</div>

		<!-- Placeholder (top) -->
		<div class="relative h-28 shrink-0 border-b border-rule">
			{@render thumbnail('size-12')}
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute bottom-2 left-2">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
		</div>

		<!-- Content (bottom) -->
		<div class="flex min-h-0 flex-1 flex-col p-3">
			<div class="flex items-center gap-2">
				<p class="label text-[10px] text-faint">{product.category}</p>
				<span class="label text-[10px] {stockStatus.class}">{stockStatus.label}</span>
			</div>
			<h3 class="mt-1 font-serif text-base leading-tight text-ink">{product.name}</h3>

			{@render rating(false)}

			<!-- Price -->
			<div class="mt-auto pt-2">
				<div class="flex items-baseline gap-2">
					<span class="font-mono text-xl text-ink">£{product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="font-mono text-[11px] text-faint line-through"
							>£{product.originalPrice.toFixed(2)}</span
						>
						<span class="label text-[10px] text-vermillion">
							-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
						</span>
					{/if}
				</div>
			</div>
		</div>
	</Card.Root>
{:else if isWide}
	<!-- Wide card layout: horizontal -->
	<Card.Root class="{cardClass} flex-row">
		<!-- Grab handle - top left -->
		<div class="absolute top-2 left-2 z-10">
			<Grabber size={16} class="bg-paper" />
		</div>

		<!-- Controls - top right -->
		<div class="absolute top-2 right-2 z-10 bg-paper">
			{@render controls()}
		</div>

		<!-- Resizer - bottom right -->
		<div class="absolute right-2 bottom-2 z-10">
			<Resizer size={16} />
		</div>

		<!-- Placeholder (left) -->
		<div class="relative w-2/5 shrink-0 border-r border-rule">
			{@render thumbnail('size-16')}
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute top-3 left-3">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
			{#if product.featured}
				<Badge variant="outline" class="absolute bottom-3 left-3 border-ink bg-paper text-ink">
					Featured
				</Badge>
			{/if}
		</div>

		<!-- Content (right) -->
		<div class="flex flex-1 flex-col p-4 pr-12">
			<div class="flex items-center gap-2">
				<p class="label text-[10px] text-faint">{product.category}</p>
				<span class="text-faint">·</span>
				<span class="label text-[10px] {stockStatus.class}">{stockStatus.label}</span>
			</div>
			<h3 class="mt-1 truncate font-serif text-[19px] leading-tight text-ink">{product.name}</h3>

			{@render rating(false)}

			<!-- Stock indicator -->
			<div class="mt-2 flex items-center gap-2">
				<div class="h-1.5 flex-1 overflow-hidden bg-tint">
					<div
						class="h-full {stockStatus.bar}"
						style="width: {Math.min(product.stock, 100)}%"
					></div>
				</div>
				<span class="font-mono text-[11px] text-faint">{product.stock} units</span>
			</div>

			<!-- Price -->
			<div class="mt-auto pt-4">
				<div class="flex items-baseline gap-2">
					<span class="font-mono text-2xl text-ink">£{product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="font-mono text-[11px] text-faint line-through">
							£{product.originalPrice.toFixed(2)}
						</span>
						<span class="label text-[10px] text-vermillion">
							-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
						</span>
					{/if}
				</div>
			</div>
		</div>
	</Card.Root>
{:else}
	<!-- Narrow card layout: vertical (tablet/desktop 1x1) -->
	<Card.Root class="{cardClass} flex-col">
		<!-- Grab handle - top left -->
		<div class="absolute top-2 left-2 z-10">
			<Grabber size={16} class="bg-paper" />
		</div>

		<!-- Controls - top right -->
		<div class="absolute top-2 right-2 z-10 bg-paper">
			{@render controls()}
		</div>

		<!-- Resizer - bottom right -->
		<div class="absolute right-2 bottom-2 z-10">
			<Resizer size={16} />
		</div>

		<!-- Placeholder (top) -->
		<div class="relative h-24 shrink-0 border-b border-rule lg:h-28">
			{@render thumbnail('size-10')}
			{#if product.badge}
				<Badge variant={badgeVariants[product.badge].variant} class="absolute bottom-2 left-2">
					{badgeVariants[product.badge].label}
				</Badge>
			{/if}
		</div>

		<!-- Content (bottom) -->
		<div class="flex min-h-0 flex-1 flex-col px-2.5 pt-1.5 pb-2">
			<div class="min-w-0 pr-6">
				<div class="flex items-center gap-1.5">
					<p class="label truncate text-[10px] text-faint">{product.category}</p>
					<span class="size-1.5 shrink-0 {stockStatus.bar}"></span>
				</div>
				<h3 class="line-clamp-2 font-serif text-[13px] leading-tight text-ink">{product.name}</h3>
			</div>

			{@render rating(true)}

			<!-- Price -->
			<div class="mt-auto">
				<div class="flex items-baseline gap-1">
					<span class="font-mono text-base text-ink">£{product.price.toFixed(2)}</span>
					{#if product.originalPrice}
						<span class="font-mono text-[10px] text-faint line-through">
							£{product.originalPrice.toFixed(2)}
						</span>
					{/if}
				</div>
			</div>
		</div>
	</Card.Root>
{/if}
