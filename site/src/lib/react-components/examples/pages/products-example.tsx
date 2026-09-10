import {
	FlexiBoard,
	FlexiTarget,
	FlexiWidget,
	ResponsiveFlexiBoard,
	cssTransitionConfig
} from '@flexiboards/react';
import type { FlexiBoardConfiguration, FlexiWidgetController } from '@flexiboards/react';
import { clsx } from 'clsx';
import { ArrowUpDown, Filter, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Button from '../common/button';
import { fieldClass, selectClass } from '../common/button-classes';
import ProductCard, { type Product } from '../products/product-card';

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

const categories = ['Audio', 'Accessories', 'Peripherals', 'Home Office'];

type SortKey = 'name' | 'price' | 'rating';

const sortLabels: Record<SortKey, string> = {
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

const boardConfig: FlexiBoardConfiguration = {
	widgetDefaults: {
		draggability: 'full',
		resizability: 'horizontal'
	}
};

const responsiveConfig = {
	breakpoints: {
		lg: 1024,
		sm: 640
	},
	// SSR can't match a media query; render the desktop board so widget
	// sizes are right for most first paints (see launcher).
	ssrBreakpoint: 'lg'
};

// The drop preview is dashed fx-accent; the widget in hand lifts instead —
// shadow-lift and a slight tilt, no border.
const className = (widget: FlexiWidgetController) =>
	clsx([
		'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
		widget.isShadow &&
			'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'rounded-[14px] shadow-lift rotate-[2.5deg] opacity-95'
	]);

// Target configs are module-level so the target's prop seam sees a stable
// object: they never change once the breakpoint's board is mounted.
const targetConfig = (rowSizing: string, rows: number, columns: number) => ({
	rowSizing,
	layout: {
		type: 'flow' as const,
		flowAxis: 'row' as const,
		placementStrategy: 'append' as const,
		rows,
		columns
	},
	widgetDefaults: {
		transition: reflowTransition
	}
});

const lgTargetConfig = targetConfig('minmax(0, 260px)', 4, 3);
const smTargetConfig = targetConfig('minmax(0, 240px)', 5, 2);
const phoneTargetConfig = targetConfig('minmax(0, 280px)', 4, 1);

export default function ProductsExample() {
	const [searchQuery, setSearchQuery] = useState('');
	// '' is "All categories" — a native <select> option can't carry null.
	const [selectedCategory, setSelectedCategory] = useState('');
	const [sortBy, setSortBy] = useState<SortKey>('name');

	let filteredProducts = products;
	if (searchQuery) {
		const query = searchQuery.toLowerCase();
		filteredProducts = filteredProducts.filter(
			(p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
		);
	}
	if (selectedCategory) {
		filteredProducts = filteredProducts.filter((p) => p.category === selectedCategory);
	}

	// One board per breakpoint, each with its own grid shape and card variant.
	const board = (options: {
		boardClass: string;
		targetClass: string;
		config: ReturnType<typeof targetConfig>;
		phone?: boolean;
	}) => (
		<FlexiBoard className={options.boardClass} config={boardConfig}>
			<FlexiTarget keyName="products" className={options.targetClass} config={options.config}>
				{filteredProducts.map((product) => (
					<FlexiWidget
						key={product.id}
						className={className}
						component={ProductCard}
						componentProps={{ product, ...(options.phone ? { phone: true } : {}) }}
						width={!options.phone && product.featured ? 2 : 1}
						minWidth={1}
						maxWidth={options.phone ? 1 : 2}
					/>
				))}
			</FlexiTarget>
		</FlexiBoard>
	);

	return (
		<main className="bg-paper relative flex h-full min-h-0 w-full flex-col gap-4 px-4 py-6 lg:gap-6 lg:px-12 lg:py-8">
			{/* Header: title, count and the two board affordances in one mono line. */}
			<header className="border-rule-soft flex shrink-0 items-center justify-between gap-3 border-b pb-3.5">
				<div className="flex min-w-0 items-baseline gap-3">
					<h1 className="text-ink font-serif text-xl leading-tight sm:text-2xl lg:text-[28px]">
						Products
					</h1>
					<p className="text-faint hidden font-mono text-[11px] sm:block">
						{filteredProducts.length} items · drag to curate · resize featured
					</p>
				</div>
				<Button size="sm" className="shrink-0 rounded-full">
					<Plus className="size-4 sm:mr-2" />
					<span className="hidden sm:inline">Add product</span>
				</Button>
			</header>

			{/* Toolbar: one row — search, category, sort, and the status key it explains. */}
			<div className="flex shrink-0 flex-wrap items-center gap-2">
				<div className="relative min-w-0 flex-1 sm:max-w-[288px] sm:flex-none">
					<Search className="text-faint absolute left-3 top-1/2 size-4 -translate-y-1/2" />
					<input
						type="search"
						placeholder="Search products…"
						aria-label="Search products"
						className={`${fieldClass} rounded-full pl-9 sm:w-[288px]`}
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
					/>
				</div>

				{/* Filter and sort are choices, so they are native selects: they say what
					they are set to, and the platform draws the list. */}
				<div className="relative shrink-0">
					<Filter className="text-faint pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2" />
					<select
						className={`${selectClass} border-rule-soft h-9 w-auto rounded-full pl-8`}
						aria-label="Filter by category"
						value={selectedCategory}
						onChange={(event) => setSelectedCategory(event.target.value)}
					>
						<option value="">All categories</option>
						{categories.map((category) => (
							<option key={category} value={category}>
								{category}
							</option>
						))}
					</select>
				</div>

				<div className="relative shrink-0">
					<ArrowUpDown className="text-faint pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2" />
					<select
						className={`${selectClass} text-body border-rule-soft h-9 w-auto rounded-full pl-8`}
						aria-label="Sort by"
						value={sortBy}
						onChange={(event) => setSortBy(event.target.value as SortKey)}
					>
						<option value="name">{sortLabels.name}</option>
						<option value="price">{sortLabels.price}</option>
						<option value="rating">{sortLabels.rating}</option>
					</select>
				</div>

				{/* Status key: soft dots, one per state a card can show. */}
				<div className="ml-auto flex items-center gap-3 sm:gap-3.5">
					<span className="text-body flex items-center gap-1.5 font-mono text-[11px]">
						<span className="bg-blue size-1.5 rounded-full"></span>In stock
					</span>
					<span className="text-faint flex items-center gap-1.5 font-mono text-[11px]">
						<span className="bg-faint size-1.5 rounded-full"></span>Low
					</span>
					<span className="text-fx-accent flex items-center gap-1.5 font-mono text-[11px]">
						<span className="bg-fx-accent size-1.5 rounded-full"></span>Limited
					</span>
				</div>
			</div>

			{/* Board */}
			<ResponsiveFlexiBoard
				config={responsiveConfig}
				lg={board({
					boardClass: 'min-h-0 flex-1 overflow-x-clip overflow-y-auto',
					targetClass: 'gap-4 p-1',
					config: lgTargetConfig
				})}
				sm={board({
					boardClass: 'products-board min-h-0 flex-1 overflow-x-clip overflow-y-auto',
					targetClass: 'gap-3 p-0.5',
					config: smTargetConfig
				})}
			>
				{/* Phone: 1 column, full vertical cards */}
				{board({
					boardClass: 'products-board min-h-0 flex-1 overflow-x-clip overflow-y-auto',
					targetClass: 'gap-3 p-1',
					config: phoneTargetConfig,
					phone: true
				})}
			</ResponsiveFlexiBoard>
		</main>
	);
}
