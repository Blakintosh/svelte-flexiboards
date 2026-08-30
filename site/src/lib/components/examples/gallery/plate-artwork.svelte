<script module lang="ts">
	import type { Motif } from './plates.js';

	export type PlateArtworkProps = {
		motif: Motif;
		pair: number;
	};
</script>

<script lang="ts">
	import { plateStyle } from './plates.js';

	let { motif, pair }: PlateArtworkProps = $props();

	const style = $derived(plateStyle(motif, pair));
</script>

<!-- The print itself: gradients only, no images and no assets. -->
<div class="h-full w-full" {style} aria-hidden="true"></div>
