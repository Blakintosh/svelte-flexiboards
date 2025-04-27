<script module lang="ts">
	import type { Component } from 'svelte';
	import { FlexiGrab, FlexiWidget } from 'svelte-flexiboards';
	import Grabber from '../common/grabber.svelte';

	type FlexionBlockContainerProps = {
		component?: Component;
	};
</script>

<script lang="ts">
	let { component: Component }: FlexionBlockContainerProps = $props();
</script>

<FlexiWidget class="group flex w-full min-w-0 items-start gap-4">
	{#snippet children()}
		<Grabber
			size={20}
			class="w-4 shrink-0 py-1 text-muted-foreground duration-75 group-hover:opacity-100 lg:opacity-0"
		/>

		<div class="w-full min-w-0 grow">
			<Component />
		</div>
	{/snippet}
</FlexiWidget>
