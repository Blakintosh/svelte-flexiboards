<script lang="ts">
	/*
	  Mounts a live React docs example (a `tsx example` fence, see
	  scripts/remark-tsx-examples.mjs) inside the Svelte docs page: the same
	  createRoot + StrictMode recipe as the React examples embed. Client-only,
	  like the React adapter itself.
	*/
	import { onMount } from 'svelte';

	type ExampleModule = Record<string, unknown> & { default?: unknown };

	let { load }: { load: () => Promise<ExampleModule> } = $props();

	let host: HTMLDivElement;

	onMount(() => {
		let root: import('react-dom/client').Root | undefined;
		let cancelled = false;

		Promise.all([import('react'), import('react-dom/client'), load()]).then(
			([{ createElement, StrictMode }, { createRoot }, mod]) => {
				if (cancelled) return;
				const Example = (mod.default ?? Object.values(mod).find((v) => typeof v === 'function')) as
					| import('react').ComponentType
					| undefined;
				if (!Example) {
					console.error('tsx example: module exports no component', mod);
					return;
				}
				root = createRoot(host);
				root.render(createElement(StrictMode, null, createElement(Example)));
			}
		);

		return () => {
			cancelled = true;
			root?.unmount();
		};
	});
</script>

<!-- contents: the React root's host must not participate in layout, so the
     example's root element sits in the preview exactly like a Svelte one. -->
<div bind:this={host} class="contents"></div>
