<script module lang="ts">
	import { blueprintTheme } from '$lib/shiki-blueprint-theme.js';

	async function loadHighlighter() {
		const highlighter = await getSingletonHighlighter({
			themes: [blueprintTheme],
			langs: ['svelte', 'javascript', 'typescript', 'html', 'css', 'shell', 'tsx', 'jsx', 'diff']
		});

		return { highlighter };
	}

	const highlighterPromise = loadHighlighter();
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { getSingletonHighlighter } from 'shiki';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';

	type CodeExampleProps = {
		src: string;
		meta: Record<string, any>;
		example: Snippet;
		code: Snippet;
	};

	let { example, code, ...props }: CodeExampleProps = $props();

	let rawElement: HTMLDivElement = $state() as HTMLDivElement;
	let copied = $state(false);

	// Reactive statement to generate highlighted HTML when src or lang changes
	let highlightedCodePromise = $derived.by(async () => {
		async function getHighlightedCode() {
			if (!rawElement) {
				return '';
			}
			const codeContents = rawElement.textContent;
			const lang = props.meta?.lang ?? 'svelte';

			try {
				const { highlighter } = await highlighterPromise;
				const html = highlighter.codeToHtml(codeContents || '', { lang, theme: 'blueprint' });
				return html;
			} catch (error) {
				console.error(`Error highlighting code as ${lang}:`, error);
				// Fallback to plain code in case of error
				const safeSrc = codeContents || '';
				return `<pre><code class="language-${lang}">${safeSrc.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`; // Added lang class to fallback
			}
		}
		return getHighlightedCode();
	});

	async function copyCode() {
		const code = rawElement.textContent || '';

		await navigator.clipboard.writeText(code);

		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	// Tabs are square mono labels; the active one takes a fx-accent underline.
	const triggerClass =
		'ui relative rounded-none border-0 border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-xs text-faint shadow-none transition-colors duration-[120ms] focus-visible:ring-0 hover:text-ink data-[state=active]:border-b-fx-accent data-[state=active]:text-ink data-[state=active]:shadow-none';
</script>

<Tabs.Root value={'preview'} class="relative mt-4">
	<Tabs.List
		class="border-rule mb-8 flex h-9 items-center justify-start rounded-none border-b bg-transparent p-0"
	>
		<Tabs.Trigger value="preview" class={triggerClass}>Preview</Tabs.Trigger>
		<Tabs.Trigger value="code" class={triggerClass}>Code</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="preview">
		<div
			class="not-prose preview ring-offset-background focus-visible:outline-hidden focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2"
		>
			{@render example()}
		</div>
	</Tabs.Content>
	<Tabs.Content value="code">
		<div
			class="not-prose code-block max-h-160 border-ink bg-field group relative overflow-clip border"
		>
			<button
				class="border-on-ink-faint/40 bg-field text-on-ink-faint hover:text-on-ink focus:outline-hidden focus:ring-fx-accent absolute right-3 top-3 z-10 border p-2 opacity-0 transition-colors duration-[120ms] focus:ring-1 group-hover:opacity-100"
				onclick={copyCode}
				aria-label="Copy code to clipboard"
			>
				{#if copied}
					<Check size={16} />
				{:else}
					<Copy size={16} />
				{/if}
			</button>
			{#await highlightedCodePromise}
				<p class="label text-on-ink-faint m-0 px-6 py-4 text-[10px]">Loading listing</p>
			{:then highlightedHtml}
				{@html highlightedHtml}
			{:catch error}
				<p class="text-on-ink m-0 px-6 py-4 font-mono text-[12.5px]">
					Error loading code: {error.message}
				</p>
			{/await}
		</div>
	</Tabs.Content>
</Tabs.Root>

<!-- This is a hack to get the raw code with indentation, because `src` doesn't include the indentation -->
<div class="hidden" bind:this={rawElement}>
	{@render code()}
</div>

<style lang="postcss">
	/* @reference '/app.css';

	.code-block > :global(pre) {
		@apply max-h-160 w-auto overflow-auto px-8 py-4 text-xs;
	} */
</style>
