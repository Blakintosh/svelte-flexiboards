<script lang="ts">
	import { onMount } from 'svelte';

	type ExampleModule = Record<string, unknown> & { default?: unknown };

	let { load }: { load: () => Promise<ExampleModule> } = $props();
	let host: HTMLDivElement;
	let status = $state<'loading' | 'ready' | 'error'>('loading');

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
	<div role="status" class="flex min-h-40 w-full flex-col justify-center gap-4">
		<div aria-hidden="true" class="space-y-2">
			<div class="border-rule bg-panel h-9 rounded-md border"></div>
			<div class="border-rule bg-panel h-9 w-5/6 rounded-md border"></div>
			<div class="border-rule bg-panel h-9 w-2/3 rounded-md border"></div>
		</div>
		<p class="text-body m-0 font-mono text-xs">Loading React example…</p>
	</div>
{:else if status === 'error'}
	<p role="alert" class="text-body m-0 flex min-h-40 items-center text-sm">
		Could not load the example. Reload the page to try again, or open Code to read its source.
	</p>
{/if}

<!-- Keep the React host out of the preview's layout. -->
<div bind:this={host} class="contents" aria-busy={status === 'loading'}></div>
