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
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';
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

	// The card's overflow menu is a native <details>: the summary is the trigger,
	// the panel is a plain list of buttons. No JS popover, no roving tabindex.
	let menuOpen = $state(false);

	const widget = getFlexiwidgetCtx();

	let isWide = $derived(widget.width > 1);

	// Cards are soft, rounded tiles at rest; hover deepens the shadow, never adds
	// a border.
	const cardClass =
		'group relative flex h-full overflow-hidden rounded-[14px] border border-rule-soft bg-panel shadow-card transition-shadow duration-[150ms] hover:shadow-card-lg';

	// At rest a card is only its product. Grab, menu and resize chrome fades in on
	// hover, and on focus-within so keyboard users can still reach it.
	const chromeClass =
		'z-10 opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none';

	// One badge per card: a live promotion is the only thing worth a fill. The
	// rest ("Featured", "New", "Bestseller") is demoted to the category line.
	let discount = $derived(
		product.originalPrice
			? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
			: 0
	);
	let saleLabel = $derived(discount > 0 ? `Sale −${discount}%` : 'Sale');
	let qualifier = $derived(
		product.featured
			? 'Featured'
			: product.badge === 'new'
				? 'New'
				: product.badge === 'bestseller'
					? 'Bestseller'
					: null
	);

	function formatReviewCount(count: number): string {
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`;
		}
		return count.toString();
	}

	function getStockStatus(stock: number): { label: string; class: string; bar: string } {
		if (stock > 50) return { label: 'In stock', class: 'text-blue', bar: 'bg-blue' };
		if (stock > 10) return { label: 'Low stock', class: 'text-body', bar: 'bg-faint' };
		return { label: 'Limited', class: 'text-fx-accent', bar: 'bg-fx-accent' };
	}

	let stockStatus = $derived(getStockStatus(product.stock));

	// Duplicate only makes sense on a card wide enough to have been featured.
	let menuItems = $derived(
		[
			{ label: 'View', icon: Eye },
			{ label: 'Edit', icon: PencilLine },
			...(isWide ? [{ label: 'Duplicate', icon: Copy }] : []),
			{ label: 'Delete', icon: Trash2, separator: true, danger: true }
		] as { label: string; icon: typeof Eye; separator?: boolean; danger?: boolean }[]
	);
</script>

<!-- Thumbnails are placeholders — a plain recessed stage, never stock imagery. -->
{#snippet thumbnail(iconSize: string)}
	<div class="bg-stage absolute inset-0"></div>
	<div class="absolute inset-0 flex items-center justify-center">
		<ShoppingCart class="{iconSize} text-faint" />
	</div>
{/snippet}

<!-- One star and the number: five glyphs said no more than one did. -->
{#snippet rating(large: boolean)}
	<div class="mt-1.5 flex items-center gap-1.5">
		<Star class="{large ? 'size-3.5' : 'size-3'} fill-ink text-ink" />
		<span class="font-mono text-[11px] text-ink">{product.rating}</span>
		<span class="text-faint font-mono text-[11px]">
			{#if large}
				· {product.reviewCount.toLocaleString()} reviews · {product.stock} units
			{:else}
				({formatReviewCount(product.reviewCount)})
			{/if}
		</span>
		{#if !large}
			<span class="ml-auto size-1.5 shrink-0 rounded-full {stockStatus.bar}"></span>
		{/if}
	</div>
{/snippet}

{#snippet categoryLine()}
	<p class="text-faint truncate text-[11.5px] font-semibold">
		{product.category}{qualifier ? ` · ${qualifier}` : ''}
	</p>
{/snippet}

<!-- A live promotion is the only thing worth a filled pill. -->
{#snippet saleBadge(position: string)}
	{#if product.badge === 'sale'}
		<span
			class="absolute {position} rounded-full bg-fx-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-card"
		>
			{saleLabel}
		</span>
	{/if}
{/snippet}

{#snippet controls()}
	<details class="relative" bind:open={menuOpen}>
		<summary
			class="text-body hover:bg-tint hover:text-ink flex size-7 cursor-pointer list-none items-center justify-center rounded-full transition-colors duration-[130ms] [&::-webkit-details-marker]:hidden"
			title="Product actions"
		>
			<MoreVertical class="size-4" />
			<span class="sr-only">Product actions</span>
		</summary>
		<div
			class="border-rule-soft bg-panel shadow-card-lg absolute top-full right-0 z-20 mt-1 w-40 rounded-[12px] border p-1"
		>
			{#each menuItems as item (item.label)}
				{@const Icon = item.icon}
				{#if item.separator}
					<div class="bg-rule-faint my-1 h-px"></div>
				{/if}
				<button
					type="button"
					class="ui hover:bg-tint flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13px] transition-colors duration-[130ms] {item.danger
						? 'text-fx-accent'
						: 'text-ink'}"
					onclick={() => (menuOpen = false)}
				>
					<Icon class="size-4" />
					{item.label}
				</button>
			{/each}
		</div>
	</details>
{/snippet}

{#if phone}
	<!-- Phone: Full-width vertical card -->
	<div class="{cardClass} flex-col">
		<div class="absolute top-2 left-2 {chromeClass}">
			<Grabber size={16} class="bg-paper" />
		</div>

		<div class="bg-paper absolute top-2 right-2 rounded-full {chromeClass}">
			{@render controls()}
		</div>

		<!-- Placeholder (top) -->
		<div class="border-rule-faint relative h-28 shrink-0 border-b">
			{@render thumbnail('size-12')}
			{@render saleBadge('bottom-2 left-2')}
		</div>

		<!-- Content (bottom) -->
		<div class="flex min-h-0 flex-1 flex-col p-3">
			<div class="flex items-center gap-2">
				{@render categoryLine()}
				<span class="text-[11px] font-semibold {stockStatus.class}">{stockStatus.label}</span>
			</div>
			<h3 class="mt-1 font-serif text-base leading-tight text-ink">{product.name}</h3>

			{@render rating(false)}

			<!-- Price sits on a hairline shelf at the foot of the card. -->
			<div class="border-rule-faint mt-auto flex items-baseline gap-2 border-t pt-2.5">
				<span class="font-mono text-xl text-ink">£{product.price.toFixed(2)}</span>
				{#if product.originalPrice}
					<span class="text-faint font-mono text-[11px] line-through">
						£{product.originalPrice.toFixed(2)}
					</span>
				{/if}
			</div>
		</div>
	</div>
{:else if isWide}
	<!-- Wide (featured) card layout: horizontal -->
	<div class="{cardClass} flex-row">
		<div class="absolute top-2 left-2 {chromeClass}">
			<Grabber size={16} class="bg-paper" />
		</div>

		<div class="bg-paper absolute top-2 right-2 rounded-full {chromeClass}">
			{@render controls()}
		</div>

		<div class="absolute right-2 bottom-2 {chromeClass}">
			<Resizer size={16} />
		</div>

		<!-- Placeholder (left) -->
		<div class="border-rule-faint relative w-2/5 shrink-0 border-r">
			{@render thumbnail('size-16')}
			{@render saleBadge('top-3 left-3')}
		</div>

		<!-- Content (right) -->
		<div class="flex min-h-0 flex-1 flex-col p-4 pr-12">
			{@render categoryLine()}
			<h3 class="mt-1.5 truncate font-serif text-[19px] leading-tight text-ink">{product.name}</h3>

			{@render rating(true)}

			<!-- Stock bar is reserved for the featured card, where there is room to read it. -->
			<div class="mt-3 flex items-center gap-2">
				<div class="bg-tint h-1.5 flex-1 overflow-hidden rounded-full">
					<div
						class="h-full rounded-full {stockStatus.bar}"
						style="width: {Math.min(product.stock, 100)}%"
					></div>
				</div>
				<span class="text-[11px] font-semibold {stockStatus.class}">{stockStatus.label}</span>
			</div>

			<div class="border-rule-faint mt-auto flex items-baseline gap-2.5 border-t pt-3">
				<span class="font-mono text-2xl text-ink">£{product.price.toFixed(2)}</span>
				{#if product.originalPrice}
					<span class="text-faint font-mono text-xs line-through">
						£{product.originalPrice.toFixed(2)}
					</span>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!-- Narrow card layout: vertical (tablet/desktop 1x1) -->
	<div class="{cardClass} flex-col">
		<div class="absolute top-2 left-2 {chromeClass}">
			<Grabber size={16} class="bg-paper" />
		</div>

		<div class="bg-paper absolute top-2 right-2 rounded-full {chromeClass}">
			{@render controls()}
		</div>

		<div class="absolute right-2 bottom-2 {chromeClass}">
			<Resizer size={16} />
		</div>

		<!-- Placeholder (top) -->
		<div class="border-rule-faint relative h-24 shrink-0 border-b lg:h-28">
			{@render thumbnail('size-10')}
			{@render saleBadge('bottom-2 left-2')}
		</div>

		<!-- Content (bottom) -->
		<div class="flex min-h-0 flex-1 flex-col px-3 pt-2 pb-2">
			<div class="min-w-0">
				{@render categoryLine()}
				<h3 class="mt-0.5 line-clamp-2 font-serif text-[13px] leading-tight text-ink">
					{product.name}
				</h3>
			</div>

			{@render rating(false)}

			<div class="border-rule-faint mt-auto border-t pt-2">
				<span class="font-mono text-base text-ink">£{product.price.toFixed(2)}</span>
			</div>
		</div>
	</div>
{/if}
