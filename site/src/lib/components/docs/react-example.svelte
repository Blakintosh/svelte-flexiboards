<script lang="ts">
	import { onMount } from 'svelte';
	import ExampleLoading from '$lib/components/ui/example-loading.svelte';
	import type { ExampleStatus } from '$lib/example-status';

	type ExampleModule = Record<string, unknown> & { default?: unknown };

	let {
		load,
		onstatuschange
	}: {
		load: () => Promise<ExampleModule>;
		onstatuschange?: (status: ExampleStatus) => void;
	} = $props();
	let host: HTMLDivElement;
	let status = $state<ExampleStatus>('loading');
	$effect(() => onstatuschange?.(status));

	onMount(() => {
		let root: import('react-dom/client').Root | undefined;
		let cancelled = false;

		Promise.all([import('react'), import('react-dom/client'), load()])
			.then(([{ createElement, StrictMode, Suspense, useLayoutEffect }, { createRoot }, mod]) => {
				if (cancelled) return;
				const Example = (mod.default ?? Object.values(mod).find((v) => typeof v === 'function')) as
					| import('react').ComponentType
					| undefined;
				if (!Example) throw new Error('tsx example: module exports no component');

				function Ready() {
					useLayoutEffect(() => {
						if (!cancelled) status = 'ready';
					}, []);
					return createElement(Example!);
				}

				function Pending() {
					useLayoutEffect(() => {
						if (!cancelled) status = 'loading';
					}, []);
					return null;
				}

				root = createRoot(host);
				root.render(
					createElement(
						StrictMode,
						null,
						createElement(Suspense, { fallback: createElement(Pending) }, createElement(Ready))
					)
				);
			})
			.catch((error) => {
				if (cancelled) return;
				console.error('Could not load React example:', error);
				status = 'error';
			});

		return () => {
			cancelled = true;
			root?.unmount();
		};
	});
</script>

{#if status === 'loading'}
	<ExampleLoading label="Loading React example…" />
{:else if status === 'error'}
	<p role="alert" class="text-body m-0 flex min-h-40 items-center text-sm">
		Could not load the example. Reload the page to try again.
	</p>
{/if}

<!-- Keep the React host out of the preview's layout. -->
<div bind:this={host} class="contents" aria-busy={status === 'loading'}></div>
