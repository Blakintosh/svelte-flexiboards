import type { Framework } from '$lib/components/brand/framework.svelte';

export type DocPage = {
	title: string;
	href: string;
	/** Frameworks this page applies to. Omitted = all. */
	frameworks?: Framework[];
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
			{ title: 'Accessibility', href: '/docs/accessibility' },
			{ title: 'Docs for LLMs', href: '/docs/llms' },
			{ title: 'Changelog', href: '/docs/changelog' },
			{ title: 'Migrating to v1.0', href: '/docs/breaking-changes-to-10' },
			// Predates the React adapter.
			{
				title: 'Breaking Changes in v0.4',
				href: '/docs/breaking-changes-to-04',
				frameworks: ['svelte']
			}
		]
	},
	{
		section: 'Guides',
		pages: [
			// Ordered as a developer meets them: the flow grid every intro example
			// uses, then the sparse grid, then composition, content, motion,
			// persistence, and finally the environment concerns.
			{ title: 'Presets', href: '/docs/presets' },
			{ title: 'Flow Grids', href: '/docs/flow-grids' },
			{ title: 'Free-Form Grids', href: '/docs/free-form-grids' },
			{ title: 'Multiple Targets', href: '/docs/multiple-targets' },
			{ title: 'Widget Rendering', href: '/docs/widget-rendering' },
			{ title: 'Transitions', href: '/docs/transitions' },
			{ title: 'Exporting & Importing', href: '/docs/guides/exporting-importing-boards' },
			{ title: 'Responsive Layouts', href: '/docs/guides/responsive-layouts' },
			{ title: 'Server-Side Rendering', href: '/docs/guides/server-side-rendering' },
			{ title: 'Registry (preview)', href: '/docs/guides/registry', frameworks: ['svelte'] }
		]
	},
	{
		section: 'Component API',
		pages: [
			{ title: 'FlexiBoard', href: '/docs/components/board' },
			{ title: 'FlexiTarget', href: '/docs/components/target' },
			{ title: 'FlexiWidget', href: '/docs/components/widget' },
			{ title: 'FlexiGrab', href: '/docs/components/grab' },
			{ title: 'FlexiResize', href: '/docs/components/resize' },
			{ title: 'ResponsiveFlexiBoard', href: '/docs/components/responsive-board' },
			{ title: 'FlexiAdd', href: '/docs/components/adder' },
			{ title: 'FlexiDelete', href: '/docs/components/deleter' }
		]
	}
];

export function pageApplies(page: DocPage, fw: Framework) {
	return !page.frameworks || page.frameworks.includes(fw);
}

/** The directory as seen from one framework: pages that don't apply are dropped. */
export function directoryFor(fw: Framework): DocSection[] {
	return directory
		.map((s) => ({ ...s, pages: s.pages.filter((p) => pageApplies(p, fw)) }))
		.filter((s) => s.pages.length > 0);
}

/** Which frameworks a doc at this path leaves out, for the page's own notice. */
export function excludedFrameworks(pathname: string): Framework[] {
	const page = directory.flatMap((s) => s.pages).find((p) => p.href === pathname);
	if (!page?.frameworks) return [];
	return (['svelte', 'react'] as Framework[]).filter((fw) => !page.frameworks!.includes(fw));
}

export type DocLocation = {
	section: DocSection;
	/** Zero-padded plate reference, e.g. "02·01" for Guides page 1. */
	plate: string;
	prev: DocPage | null;
	next: DocPage | null;
};

const pad = (n: number) => String(n + 1).padStart(2, '0');

/**
 * Locates a doc within the framework's directory, so plate numbers and
 * prev/next skip pages that don't apply. A page outside the framework's
 * directory (e.g. the SSR guide while React is selected) still locates against
 * the full directory, so its header and neighbours keep working.
 */
export function locateDoc(pathname: string, fw?: Framework): DocLocation | null {
	const dir = fw ? directoryFor(fw) : directory;
	let flat = dir.flatMap((section, si) =>
		section.pages.map((page, pi) => ({ section, si, pi, page }))
	);
	let i = flat.findIndex((e) => e.page.href === pathname);
	if (i === -1 && fw) {
		flat = directory.flatMap((section, si) =>
			section.pages.map((page, pi) => ({ section, si, pi, page }))
		);
		i = flat.findIndex((e) => e.page.href === pathname);
	}
	if (i === -1) return null;
	const { section, si, pi } = flat[i];
	return {
		section,
		plate: `${pad(si)}·${pad(pi)}`,
		prev: flat[i - 1]?.page ?? null,
		next: flat[i + 1]?.page ?? null
	};
}
