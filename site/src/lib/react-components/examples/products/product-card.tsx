import { useFlexiWidget } from '@flexiboards/react';
import {
	Copy,
	Eye,
	MoreVertical,
	PencilLine,
	ShoppingCart,
	Star,
	Trash2,
	type LucideIcon
} from 'lucide-react';
import { Fragment, useRef } from 'react';
import Grabber from '../common/grabber';
import Resizer from '../common/resizer';

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

// Cards are soft, rounded tiles at rest; hover deepens the shadow, never adds
// a border.
const cardClass =
	'group relative flex h-full overflow-hidden rounded-[14px] border border-rule-soft bg-panel shadow-card transition-shadow duration-[150ms] hover:shadow-card-lg';

// At rest a card is only its product. Grab, menu and resize chrome fades in on
// hover, and on focus-within so keyboard users can still reach it.
const chromeClass =
	'z-10 opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none';

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

export default function ProductCard({ product, phone = false }: ProductCardProps) {
	const widget = useFlexiWidget();
	const isWide = widget.width > 1;

	// The card's overflow menu is a native <details>: the summary is the trigger,
	// the panel is a plain list of buttons. No JS popover, no roving tabindex.
	const menu = useRef<HTMLDetailsElement | null>(null);

	// One badge per card: a live promotion is the only thing worth a fill. The
	// rest ("Featured", "New", "Bestseller") is demoted to the category line.
	const discount = product.originalPrice
		? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
		: 0;
	const saleLabel = discount > 0 ? `Sale −${discount}%` : 'Sale';
	const qualifier = product.featured
		? 'Featured'
		: product.badge === 'new'
			? 'New'
			: product.badge === 'bestseller'
				? 'Bestseller'
				: null;

	const stockStatus = getStockStatus(product.stock);

	// Duplicate only makes sense on a card wide enough to have been featured.
	const menuItems: { label: string; icon: LucideIcon; separator?: boolean; danger?: boolean }[] = [
		{ label: 'View', icon: Eye },
		{ label: 'Edit', icon: PencilLine },
		...(isWide ? [{ label: 'Duplicate', icon: Copy }] : []),
		{ label: 'Delete', icon: Trash2, separator: true, danger: true }
	];

	// Thumbnails are placeholders — a plain recessed stage, never stock imagery.
	const thumbnail = (iconSize: string) => (
		<>
			<div className="bg-stage absolute inset-0"></div>
			<div className="absolute inset-0 flex items-center justify-center">
				<ShoppingCart className={`${iconSize} text-faint`} />
			</div>
		</>
	);

	// One star and the number: five glyphs said no more than one did.
	const rating = (large: boolean) => (
		<div className="mt-1.5 flex items-center gap-1.5">
			<Star className={`${large ? 'size-3.5' : 'size-3'} fill-ink text-ink`} />
			<span className="font-mono text-[11px] text-ink">{product.rating}</span>
			<span className="text-faint font-mono text-[11px]">
				{large
					? `· ${product.reviewCount.toLocaleString()} reviews · ${product.stock} units`
					: `(${formatReviewCount(product.reviewCount)})`}
			</span>
			{!large && <span className={`ml-auto size-1.5 shrink-0 rounded-full ${stockStatus.bar}`}></span>}
		</div>
	);

	const categoryLine = (
		<p className="text-faint truncate text-[11.5px] font-semibold">
			{product.category}
			{qualifier ? ` · ${qualifier}` : ''}
		</p>
	);

	// A live promotion is the only thing worth a filled pill.
	const saleBadge = (position: string) =>
		product.badge === 'sale' ? (
			<span
				className={`absolute ${position} rounded-full bg-fx-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-card`}
			>
				{saleLabel}
			</span>
		) : null;

	const controls = (
		<details className="relative" ref={menu}>
			<summary
				className="text-body hover:bg-tint hover:text-ink flex size-7 cursor-pointer list-none items-center justify-center rounded-full transition-colors duration-[130ms] [&::-webkit-details-marker]:hidden"
				title="Product actions"
			>
				<MoreVertical className="size-4" />
				<span className="sr-only">Product actions</span>
			</summary>
			<div className="border-rule-soft bg-panel shadow-card-lg absolute top-full right-0 z-20 mt-1 w-40 rounded-[12px] border p-1">
				{menuItems.map((item) => {
					const Icon = item.icon;
					return (
						<Fragment key={item.label}>
							{item.separator && <div className="bg-rule-faint my-1 h-px"></div>}
							<button
								type="button"
								className={`ui hover:bg-tint flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13px] transition-colors duration-[130ms] ${
									item.danger ? 'text-fx-accent' : 'text-ink'
								}`}
								onClick={() => {
									if (menu.current) menu.current.open = false;
								}}
							>
								<Icon className="size-4" />
								{item.label}
							</button>
						</Fragment>
					);
				})}
			</div>
		</details>
	);

	if (phone) {
		// Phone: Full-width vertical card
		return (
			<div className={`${cardClass} flex-col`}>
				<div className={`absolute top-2 left-2 ${chromeClass}`}>
					<Grabber size={16} className="bg-paper" />
				</div>

				<div className={`bg-paper absolute top-2 right-2 rounded-full ${chromeClass}`}>{controls}</div>

				{/* Placeholder (top) */}
				<div className="border-rule-faint relative h-28 shrink-0 border-b">
					{thumbnail('size-12')}
					{saleBadge('bottom-2 left-2')}
				</div>

				{/* Content (bottom) */}
				<div className="flex min-h-0 flex-1 flex-col p-3">
					<div className="flex items-center gap-2">
						{categoryLine}
						<span className={`text-[11px] font-semibold ${stockStatus.class}`}>
							{stockStatus.label}
						</span>
					</div>
					<h3 className="mt-1 font-serif text-base leading-tight text-ink">{product.name}</h3>

					{rating(false)}

					{/* Price sits on a hairline shelf at the foot of the card. */}
					<div className="border-rule-faint mt-auto flex items-baseline gap-2 border-t pt-2.5">
						<span className="font-mono text-xl text-ink">£{product.price.toFixed(2)}</span>
						{product.originalPrice && (
							<span className="text-faint font-mono text-[11px] line-through">
								£{product.originalPrice.toFixed(2)}
							</span>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (isWide) {
		// Wide (featured) card layout: horizontal
		return (
			<div className={`${cardClass} flex-row`}>
				<div className={`absolute top-2 left-2 ${chromeClass}`}>
					<Grabber size={16} className="bg-paper" />
				</div>

				<div className={`bg-paper absolute top-2 right-2 rounded-full ${chromeClass}`}>{controls}</div>

				<div className={`absolute right-2 bottom-2 ${chromeClass}`}>
					<Resizer size={16} />
				</div>

				{/* Placeholder (left) */}
				<div className="border-rule-faint relative w-2/5 shrink-0 border-r">
					{thumbnail('size-16')}
					{saleBadge('top-3 left-3')}
				</div>

				{/* Content (right) */}
				<div className="flex min-h-0 flex-1 flex-col p-4 pr-12">
					{categoryLine}
					<h3 className="mt-1.5 truncate font-serif text-[19px] leading-tight text-ink">
						{product.name}
					</h3>

					{rating(true)}

					{/* Stock bar is reserved for the featured card, where there is room to read it. */}
					<div className="mt-3 flex items-center gap-2">
						<div className="bg-tint h-1.5 flex-1 overflow-hidden rounded-full">
							<div
								className={`h-full rounded-full ${stockStatus.bar}`}
								style={{ width: `${Math.min(product.stock, 100)}%` }}
							></div>
						</div>
						<span className={`text-[11px] font-semibold ${stockStatus.class}`}>
							{stockStatus.label}
						</span>
					</div>

					<div className="border-rule-faint mt-auto flex items-baseline gap-2.5 border-t pt-3">
						<span className="font-mono text-2xl text-ink">£{product.price.toFixed(2)}</span>
						{product.originalPrice && (
							<span className="text-faint font-mono text-xs line-through">
								£{product.originalPrice.toFixed(2)}
							</span>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Narrow card layout: vertical (tablet/desktop 1x1)
	return (
		<div className={`${cardClass} flex-col`}>
			<div className={`absolute top-2 left-2 ${chromeClass}`}>
				<Grabber size={16} className="bg-paper" />
			</div>

			<div className={`bg-paper absolute top-2 right-2 rounded-full ${chromeClass}`}>{controls}</div>

			<div className={`absolute right-2 bottom-2 ${chromeClass}`}>
				<Resizer size={16} />
			</div>

			{/* Placeholder (top) */}
			<div className="border-rule-faint relative h-24 shrink-0 border-b lg:h-28">
				{thumbnail('size-10')}
				{saleBadge('bottom-2 left-2')}
			</div>

			{/* Content (bottom) */}
			<div className="flex min-h-0 flex-1 flex-col px-3 pt-2 pb-2">
				<div className="min-w-0">
					{categoryLine}
					<h3 className="mt-0.5 line-clamp-2 font-serif text-[13px] leading-tight text-ink">
						{product.name}
					</h3>
				</div>

				{rating(false)}

				<div className="border-rule-faint mt-auto border-t pt-2">
					<span className="font-mono text-base text-ink">£{product.price.toFixed(2)}</span>
				</div>
			</div>
		</div>
	);
}
