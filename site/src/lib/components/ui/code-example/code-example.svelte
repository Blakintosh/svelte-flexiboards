<script module lang="ts">
	import { getSingletonHighlighter } from 'shiki';
	import { blueprintTheme } from '$lib/shiki-blueprint-theme.js';

	const highlighterPromise = getSingletonHighlighter({
		themes: [blueprintTheme],
		langs: [
			'svelte',
			'javascript',
			'typescript',
			'html',
			'css',
			'shell',
			'tsx',
			'jsx',
			'diff',
			'json'
		]
	});
</script>

<script lang="ts">
	import { onDestroy, type Snippet } from 'svelte';
	import { Tabs } from 'bits-ui';
	import { SiSvelte, SiReact } from '@icons-pack/svelte-simple-icons';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import { copyText } from '$lib/copy-text';

	type CodeExampleProps = {
		src: string;
		meta: { lang?: string; title?: string } & Record<string, unknown>;
		example: Snippet;
		code: Snippet;
	};

	let { src, meta, example, code }: CodeExampleProps = $props();
	let rawElement = $state<HTMLDivElement>();
	let copyStatus = $state('');
	let view = $state('preview');
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const lang = $derived(meta.lang ?? 'svelte');
	const isReact = $derived(lang === 'tsx' || lang === 'jsx');
	const framework = $derived(isReact ? 'React' : 'Svelte');
	const Icon = $derived(isReact ? SiReact : SiSvelte);
	const title = $derived(meta.title ?? (isReact ? 'Example.tsx' : 'Example.svelte'));
	// The rendered code snippet preserves indentation and unescaped template literals.
	const source = $derived(rawElement?.textContent ?? src);
	const highlightedCodePromise = $derived(
		highlighterPromise.then((highlighter) =>
			highlighter.codeToHtml(source, { lang, theme: 'blueprint' })
		)
	);

	async function copyCode() {
		clearTimeout(copyTimer);
		copyStatus = (await copyText(source)) ? 'Copied' : 'Copy blocked';
		copyTimer = setTimeout(() => (copyStatus = ''), 2000);
	}

	onDestroy(() => clearTimeout(copyTimer));

	const triggerClass =
		'ui text-body hover:text-ink hover:bg-tint inline-flex h-11 items-center justify-center px-4 text-xs font-medium transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
</script>

<Tabs.Root
	bind:value={view}
	class="not-prose code-example border-rule bg-paper my-8 min-w-0 border"
>
	<div class="border-rule bg-panel grid grid-cols-1 items-center border-b sm:flex">
		<div class="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
			<span class="text-body inline-flex shrink-0 items-center gap-1.5 text-xs font-medium">
				<Icon
					size={15}
					class={isReact ? 'text-[#087ea4] dark:text-[#61dafb]' : 'text-[#e2452b]'}
					aria-hidden="true"
				/>
				{framework}
			</span>
			<span class="border-rule text-faint truncate border-l pl-3 font-mono text-xs" {title}>
				{title}
			</span>
		</div>
		<Tabs.List
			aria-label={`${framework} example view`}
			class="border-rule relative grid grid-cols-2 border-t sm:w-40 sm:shrink-0 sm:border-t-0"
		>
			<Tabs.Trigger value="preview" class={triggerClass}>Preview</Tabs.Trigger>
			<Tabs.Trigger value="code" class={triggerClass}>Code</Tabs.Trigger>
			<div
				aria-hidden="true"
				class="text-ink pointer-events-none absolute inset-0 grid select-none grid-cols-2 transition-[clip-path] duration-[220ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] motion-reduce:transition-none"
				style:clip-path={view === 'preview' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)'}
			>
				<span
					class="ui border-fx-accent flex h-11 items-center justify-center border-b-2 pt-0.5 text-xs font-medium"
					>Preview</span
				>
				<span
					class="ui border-fx-accent flex h-11 items-center justify-center border-b-2 pt-0.5 text-xs font-medium"
					>Code</span
				>
			</div>
		</Tabs.List>
	</div>
	<Tabs.Content
		value="preview"
		class="focus-visible:outline-ink min-w-0 focus-visible:outline-2 focus-visible:-outline-offset-2"
	>
		<div class="preview min-h-48 overflow-x-auto p-4 sm:p-6">
			{@render example()}
		</div>
	</Tabs.Content>
	<Tabs.Content value="code" class="relative min-w-0 outline-none" tabindex={-1}>
		<button
			type="button"
			class="border-on-ink-faint/40 bg-field text-on-ink-faint hover:text-on-ink focus-visible:outline-on-ink absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-md border transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
			onclick={copyCode}
			disabled={!rawElement}
			aria-label={copyStatus || 'Copy code to clipboard'}
			title={copyStatus || 'Copy code'}
		>
			<span aria-hidden="true" class="copy-icon" class:inactive={copyStatus === 'Copied'}
				><Copy size={16} /></span
			>
			<span aria-hidden="true" class="copy-icon" class:inactive={copyStatus !== 'Copied'}
				><Check size={16} /></span
			>
		</button>
		<span class="sr-only" role="status">{copyStatus}</span>
		<!-- The source scroller needs keyboard access. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="code-block bg-field text-on-ink focus-visible:outline-on-ink max-h-[min(36rem,65svh)] overflow-auto overscroll-x-contain focus-visible:outline-2 focus-visible:-outline-offset-2"
			role="region"
			aria-label={`${framework} example source`}
			tabindex="0"
		>
			{#await highlightedCodePromise}
				<pre><code>{source}</code></pre>
			{:then highlightedHtml}
				<!-- Shiki output from our own source files. -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html highlightedHtml}
			{:catch}
				<pre><code>{source}</code></pre>
			{/await}
		</div>
	</Tabs.Content>
</Tabs.Root>

<div hidden bind:this={rawElement}>
	{@render code()}
</div>

<style lang="postcss">
	@reference '../../../../app.css';

	.copy-icon {
		@apply col-start-1 row-start-1;
		transition:
			opacity 160ms ease-out,
			filter 160ms ease-out,
			transform 160ms ease-out;
	}

	.copy-icon.inactive {
		opacity: 0;
		filter: blur(2px);
		transform: scale(0.75);
	}

	@media (prefers-reduced-motion: reduce) {
		.copy-icon {
			transition-property: opacity;
		}

		.copy-icon.inactive {
			filter: none;
			transform: none;
		}
	}

	.code-block {
		scrollbar-width: thin;
		scrollbar-color: var(--on-ink-faint) var(--field);
		scrollbar-gutter: stable;
	}

	.code-block :global(pre) {
		@apply m-0 min-w-max border-0 px-4 py-5 font-mono text-[13px] leading-6 sm:px-6 sm:py-6 sm:text-sm;
		tab-size: 2;
		background-color: transparent !important;
	}

	.code-block :global(code) {
		font: inherit;
	}
</style>
