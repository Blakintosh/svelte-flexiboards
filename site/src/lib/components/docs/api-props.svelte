<script module lang="ts">
	import type { ApiReference as ApiEntry } from './api-reference.svelte';

	/**
	 * The component props table for the current framework. The extractor emits
	 * `props` (Svelte) and `propsReact`; this picks one so a page needs a single
	 * tag rather than two gated tables.
	 */
	type ApiPropsProps = {
		api: { props: ApiEntry[]; propsReact?: ApiEntry[] };
		title?: string;
	};
</script>

<script lang="ts">
	import ApiReference from './api-reference.svelte';
	import { framework } from '$lib/components/brand/framework.svelte';

	let { api, title = 'Props' }: ApiPropsProps = $props();
	const rows = $derived(framework.current === 'react' ? (api.propsReact ?? api.props) : api.props);
</script>

<ApiReference {title} api={rows} />
