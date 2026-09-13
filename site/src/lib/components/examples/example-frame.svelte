<script lang="ts">
	import ExampleLoading from '$lib/components/ui/example-loading.svelte';
	import type { ExampleStatus } from '$lib/example-status';

	let {
		src,
		title,
		width = '100%',
		class: className = ''
	}: { src: string; title: string; width?: string; class?: string } = $props();
	let frame = $state<HTMLIFrameElement>();
	let status = $state<ExampleStatus>('loading');
	let slow = $state(false);
	let attempt = $state(0);

	$effect(() => {
		// Each document gets its own deadline, including retries of the same URL.
		void src;
		void attempt;
		status = 'loading';
		slow = false;
		const timer = setTimeout(() => {
			slow = true;
		}, 15_000);
		return () => clearTimeout(timer);
	});

	function receiveStatus(event: MessageEvent) {
		if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return;
		const message = event.data;
		if (message?.type !== 'flexiboards:example-status' || message.path !== src) return;
		if (message.status === 'loading' || message.status === 'ready' || message.status === 'error') {
			status = message.status;
		}
	}
</script>

<svelte:window onmessage={receiveStatus} />

<div
	class="ease-snap bg-paper relative h-full min-h-[560px] max-w-full transition-[width] duration-300 motion-reduce:transition-none {className}"
	style:width
	aria-busy={status === 'loading'}
>
	{#key `${src}:${attempt}`}
		<iframe
			bind:this={frame}
			{src}
			{title}
			class="h-full min-h-[560px] w-full"
			class:invisible={status !== 'ready'}
			inert={status !== 'ready'}
			onerror={() => (status = 'error')}
		></iframe>
	{/key}
	{#if status !== 'ready'}
		<div class="bg-paper absolute inset-0 grid place-content-center gap-5 p-6 sm:p-10">
			{#if status === 'loading'}
				<ExampleLoading label={`Loading ${title.toLowerCase()}…`} />
				{#if slow}<p class="text-body m-0 text-center text-sm">
						This example is taking longer to load.
					</p>{/if}
			{:else}
				<p role="alert" class="text-body m-0 text-center text-sm">
					Could not load the {title.toLowerCase()}.
				</p>
			{/if}
			{#if slow || status === 'error'}
				<button
					type="button"
					class="border-rule text-ink hover:bg-tint focus-visible:outline-ink mx-auto min-h-11 border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
					onclick={() => attempt++}>Retry example</button
				>
			{/if}
		</div>
	{/if}
</div>
