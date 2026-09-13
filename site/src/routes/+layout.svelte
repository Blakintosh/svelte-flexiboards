<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { framework } from '$lib/components/brand/framework.svelte';
	import { packageManager } from '$lib/components/docs/package-manager.svelte';
	import { setRevealsSuppressed } from '$lib/actions/reveal';

	let { data, children } = $props();
	const seo = $derived(
		page.data.seo ?? {
			title: 'Flexiboards · Drag-and-drop grids for Svelte and React',
			description:
				'Build dashboards and sortable layouts with headless Svelte and React components. Move and resize widgets, save layouts, and style every element.'
		}
	);
	const canonical = $derived(new URL(page.url.pathname, data.siteOrigin).href);

	// Seed the framework choice from the cookie the server read, at init, so the
	// server-rendered markup and the first client render agree.
	framework.hydrate(data.framework);
	packageManager.hydrate(data.packageManager);

	// Scroll reveals play only on first arrival. Back/forward navigation lands on
	// content already seen, so it should mount settled. Set before the destination
	// page mounts; a normal link or goto re-enables.
	beforeNavigate((navigation) => {
		setRevealsSuppressed(navigation.type === 'popstate');
	});
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Flexiboards" />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={canonical} />
</svelte:head>

<ModeWatcher />

{@render children()}
