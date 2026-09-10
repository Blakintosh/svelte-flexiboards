<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { beforeNavigate } from '$app/navigation';
	import { framework } from '$lib/components/brand/framework.svelte';
	import { packageManager } from '$lib/components/docs/package-manager.svelte';
	import { setRevealsSuppressed } from '$lib/actions/reveal';

	let { data, children } = $props();

	// Seed the framework choice from the cookie the server read, at init, so
	// the server-rendered markup and the first client render agree.
	framework.hydrate(data.framework);
	packageManager.hydrate(data.packageManager);

	// Scroll reveals play on first arrival only: going back (or forward) through
	// history lands on content the user has already seen, so it mounts settled.
	// Set before the destination page mounts; a normal link/goto re-enables.
	beforeNavigate((navigation) => {
		setRevealsSuppressed(navigation.type === 'popstate');
	});
</script>

<svelte:head>
	<title>Flexiboards</title>
	<meta name="description" content="Headless drag &amp; drop grids" />
</svelte:head>

<ModeWatcher />

{@render children()}
