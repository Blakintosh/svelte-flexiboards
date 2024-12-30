<script module lang="ts">
	import type { FlexiTarget } from '$lib/engine/target.svelte.js';

	export type FlexiDebugProps = {
		target: FlexiTarget;
	};
</script>

<script lang="ts">
	let { target }: FlexiDebugProps = $props();

	function bitmapToBitArray(bitmap: number, size: number): boolean[] {
		// Convert to binary string and pad with leading zeros up to max size
		const binaryStr = bitmap.toString(2).padStart(size, '0').split('').reverse().join('');
		// Convert to boolean array
		return binaryStr.split('').map((bit) => bit === '1');
	}
</script>

<div class="container">
	<div>
		<h3>Target information</h3>
		<ul>
			<li>
				Row count: {target.rows}
			</li>
			<li>
				Column count: {target.columns}
			</li>
		</ul>
	</div>
	<div>
		<h3>Underlying Representation</h3>
	</div>
	<div class="bitmaps-view">
		<div>
			<h3>Bitmaps</h3>

			<div class="bitmaps row">
				{#each target.debug_gridBitmaps as bitmap}
					<div class="bitmap row">
						{#each bitmapToBitArray(bitmap, target.columns) as bit}
							<div class="bitmap-cell {bit ? 'filled' : 'empty'}"></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
		<div>
			<h3>Stored Layout</h3>

			<div class="grid-layout">
				{#each target.debug_gridLayout as row (row)}
					<div class="grid-row">
						{#each row as cell}
							<div class="grid-cell {cell ? 'filled' : 'empty'}"></div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		padding: 0;
		border: 1px solid #ccc;
		border-radius: 0.25rem;
	}

	.container > :not(:last-child) {
		border-bottom: 1px solid #ccc;
	}

	.container > div {
		padding: 0.5rem 1rem;
	}

	.container h3 {
		font-size: 1rem;
		font-weight: 700;
	}

	.bitmaps {
		display: flex;
	}

	.bitmaps.row {
		flex-direction: column;
	}

	.bitmap {
		display: flex;
		flex-direction: column;
	}

	.bitmap.row {
		flex-direction: row;
	}

	.bitmap > div {
		width: 16px;
		height: 16px;
		background-color: #0f0;
	}

	.bitmap > div.filled {
		background-color: #f00;
	}

	.bitmaps-view {
		display: flex;
		flex-direction: row;
	}

	.bitmaps-view > div {
		flex: 1;
	}

	.grid-layout {
		display: flex;
		flex-direction: column;
	}

	.grid-row {
		display: flex;
		flex-direction: row;
	}

	.grid-cell {
		width: 16px;
		height: 16px;
		background-color: #0f0;
	}

	.grid-cell.filled {
		background-color: #f00;
	}
</style>
