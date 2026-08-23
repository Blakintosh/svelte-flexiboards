export type DocPage = {
	title: string;
	href: string;
};

export type DocSection = {
	section: string;
	pages: DocPage[];
};

export const directory: DocSection[] = [
	{
		section: 'Introduction',
		pages: [
			{ title: 'Overview', href: '/docs/overview' },
			{ title: 'Configuration', href: '/docs/configuration' },
			{ title: 'Controllers', href: '/docs/controllers' },
			{ title: 'Breaking Changes in v0.4', href: '/docs/breaking-changes-to-04' }
		]
	},
	{
		section: 'Guides',
		pages: [
			{ title: 'Free-Form Grids', href: '/docs/free-form-grids' },
			{ title: 'Flow Grids', href: '/docs/flow-grids' },
			{ title: 'Widget Rendering', href: '/docs/widget-rendering' },
			{ title: 'Multiple Targets', href: '/docs/multiple-targets' },
			{ title: 'Transitions', href: '/docs/transitions' },
			{ title: 'Exporting & Importing', href: '/docs/guides/exporting-importing-boards' },
			{ title: 'Responsive Layouts', href: '/docs/guides/responsive-layouts' }
		]
	},
	{
		section: 'Component API',
		pages: [
			{ title: 'FlexiBoard', href: '/docs/components/board' },
			{ title: 'FlexiTarget', href: '/docs/components/target' },
			{ title: 'FlexiWidget', href: '/docs/components/widget' },
			{ title: 'ResponsiveFlexiBoard', href: '/docs/components/responsive-board' },
			{ title: 'FlexiAdd', href: '/docs/components/adder' },
			{ title: 'FlexiDelete', href: '/docs/components/deleter' }
		]
	}
];

export const pageCount = directory.reduce((n, s) => n + s.pages.length, 0);

export type DocLocation = {
	section: DocSection;
	/** Zero-padded plate reference, e.g. "02·01" for Guides page 1. */
	plate: string;
	prev: DocPage | null;
	next: DocPage | null;
};

const flat = directory.flatMap((section, si) =>
	section.pages.map((page, pi) => ({ section, si, pi, page }))
);

const pad = (n: number) => String(n + 1).padStart(2, '0');

export function locateDoc(pathname: string): DocLocation | null {
	const i = flat.findIndex((e) => e.page.href === pathname);
	if (i === -1) return null;
	const { section, si, pi } = flat[i];
	return {
		section,
		plate: `${pad(si)}·${pad(pi)}`,
		prev: flat[i - 1]?.page ?? null,
		next: flat[i + 1]?.page ?? null
	};
}
