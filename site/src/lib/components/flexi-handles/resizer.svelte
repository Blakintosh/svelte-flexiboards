<script lang="ts">
	import Resizer from '$lib/registry/svelte/flexi-handles/resizer.svelte';
	import type { ComponentProps } from 'svelte';
	let props: ComponentProps<typeof Resizer> = $props();
</script>

<Resizer {...props} />
