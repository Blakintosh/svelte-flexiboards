<script lang="ts">
	import FlexiSortable from '../../src/components/flexi-sortable.svelte';
	import FlexiDashboard from '../../src/components/flexi-dashboard.svelte';
	import FlexiWidget from '../../src/components/flexi-widget.svelte';
</script>

<FlexiSortable class="list">
	<FlexiWidget>{#snippet children()}a{/snippet}</FlexiWidget>
	<FlexiWidget>{#snippet children()}b{/snippet}</FlexiWidget>
</FlexiSortable>

<FlexiDashboard columns={3} rows={2} resizable class="grid">
	<FlexiWidget x={0} y={0} width={2} height={1}>{#snippet children()}wide{/snippet}</FlexiWidget>
</FlexiDashboard>
