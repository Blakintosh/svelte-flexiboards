# @flexiboards/svelte

Headless drag-and-drop boards for Svelte 5. Docs: [flexiboards.dev](https://flexiboards.dev/)

```
npm i @flexiboards/svelte
```

```svelte
<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
</script>

<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
	<FlexiTarget
		key="list"
		class="gap-2"
		config={{ layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append' } }}
	>
		<FlexiWidget class="rounded border p-3">First</FlexiWidget>
		<FlexiWidget class="rounded border p-3">Second</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
```

Moving from `svelte-flexiboards`? Read the [migration guide](https://flexiboards.dev/docs/breaking-changes-to-10).

Issues go on the [GitHub issues page](https://github.com/Blakintosh/svelte-flexiboards/issues).

## Licence

MIT. See [LICENSE.md](https://github.com/Blakintosh/svelte-flexiboards/blob/main/LICENSE.md).
