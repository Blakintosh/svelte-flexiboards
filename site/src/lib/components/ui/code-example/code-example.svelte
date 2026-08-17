<script module lang="ts">
	import { blueprintTheme } from '$lib/shiki-blueprint-theme.js';

	async function loadHighlighter() {
		const highlighter = await getSingletonHighlighter({
			themes: [blueprintTheme],
			langs: ['svelte', 'javascript', 'typescript', 'html', 'css', 'shell']
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
			const lang = 'svelte';

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

	// Tabs are square mono labels; the active one takes a vermillion underline.
	const triggerClass =
		'label relative rounded-none border-0 border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 text-[11px] text-faint shadow-none transition-colors duration-[120ms] focus-visible:ring-0 hover:text-ink data-[state=active]:border-b-vermillion data-[state=active]:text-ink data-[state=active]:shadow-none';
</script>

<Tabs.Root value={'preview'} class="relative mt-4">
	<Tabs.List
		class="mb-8 flex h-9 items-center justify-start rounded-none border-b border-rule bg-transparent p-0"
	>
		<Tabs.Trigger value="preview" class={triggerClass}>Preview</Tabs.Trigger>
		<Tabs.Trigger value="code" class={triggerClass}>Code</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="preview">
		<div
			class="not-prose preview mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
		>
			{@render example()}
		</div>
	</Tabs.Content>
	<Tabs.Content value="code">
		<div
			class="not-prose code-block group relative max-h-160 overflow-clip border border-ink bg-field"
		>
			<button
				class="label absolute right-3 top-3 z-10 border border-on-ink-faint/40 bg-field p-2 text-on-ink-faint opacity-0 transition-colors duration-[120ms] hover:text-on-ink focus:outline-hidden focus:ring-1 focus:ring-vermillion group-hover:opacity-100"
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
				<p class="label m-0 px-6 py-4 text-[10px] text-on-ink-faint">Loading listing</p>
			{:then highlightedHtml}
				{@html highlightedHtml}
			{:catch error}
				<p class="m-0 px-6 py-4 font-mono text-[12.5px] text-on-ink">
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
