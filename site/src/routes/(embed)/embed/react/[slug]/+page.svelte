<script lang="ts">
	let { data } = $props();

	let host: HTMLDivElement;

	// An effect keyed on the slug, not onMount: SvelteKit reuses this page
	// component when only the slug changes, so a client-side navigation
	// between two React examples must swap the React root too.
	$effect(() => {
		const slug = data.slug;
		let root: import('react-dom/client').Root | undefined;
		let cancelled = false;

		// Dynamic imports keep react/react-dom in a lazy chunk only React
		// embeds download.
		Promise.all([
			import('react'),
			import('react-dom/client'),
			import(`$lib/react-components/examples/pages/${slug}-example.tsx`)
		]).then(([{ createElement, StrictMode }, { createRoot }, { default: Example }]) => {
			if (cancelled) return;

			root = createRoot(host);
			// createElement, not Example(): the component must be invoked by
			// React's renderer, or its hooks run outside a render context.
			root.render(createElement(StrictMode, null, createElement(Example)));
		});

		return () => {
			cancelled = true;
			root?.unmount();
		};
	});
</script>

<svelte:head>
	<title>{data.slug.charAt(0).toUpperCase() + data.slug.slice(1)} - Flexiboards Example</title>
</svelte:head>

<div class="flex h-full w-full items-stretch">
	<!-- contents: the React root's host must not participate in layout, so the
	     example's root element is a direct flex item, matching the Svelte embed. -->
	<div bind:this={host} class="contents"></div>
</div>
