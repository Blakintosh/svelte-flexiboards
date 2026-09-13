<script lang="ts">
	import Grabber from '$lib/registry/svelte/flexi-handles/grabber.svelte';
	import type { ComponentProps } from 'svelte';
	let props: ComponentProps<typeof Grabber> = $props();
</script>

<Grabber {...props} />
