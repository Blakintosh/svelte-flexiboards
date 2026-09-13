<script lang="ts">
	import { page } from '$app/stores';
	import Board from './board.svelte';
	import ReactExample from '$lib/components/docs/react-example.svelte';
</script>

<svelte:head><title>Accessibility test board</title></svelte:head>
<main>
	<h1>Accessibility test board</h1>
	<p>Use Enter to grab or resize, arrow keys to move, and Escape to cancel.</p>
	{#if $page.url.searchParams.get('framework') === 'react'}
		<ReactExample load={() => import('./board')} />
	{:else}
		<Board />
	{/if}
	<button type="button">After board</button>
</main>

<style>
	:global(body) {
		background: white;
		color: #111;
	}
	main {
		padding: 24px;
	}
	:global(.test-board) {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		margin: 24px 0;
	}
	:global(.test-board [role='grid']) {
		outline: 1px solid #555;
	}
	:global([data-flexi-widget]) {
		background: white;
		color: #111;
		border: 1px solid #555;
	}
	:global(button) {
		min-height: 32px;
		padding: 4px;
		border: 1px solid #555;
		background: white;
		color: #111;
	}
	:global(:focus-visible) {
		outline: 2px solid blue;
		outline-offset: 2px;
	}
</style>
