<script module lang="ts">
	export type SchemaPanelProps = {
		fields: FieldEntry[];
		selectedUid: string | undefined;
	};
</script>

<script lang="ts">
	import Button from '../common/button.svelte';
	import { cn } from '$lib/utils.js';
	import Check from 'lucide-svelte/icons/check';
	import { toSchemaEntry, type FieldEntry } from './field-types.js';

	let { fields, selectedUid }: SchemaPanelProps = $props();

	const schema = $derived(fields.map((field) => toSchemaEntry(field.meta)));
	const serialised = $derived(JSON.stringify(schema, null, 2));

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	function block(index: number): string {
		const body = JSON.stringify(schema[index], null, 2)
			.split('\n')
			.map((line) => `  ${line}`)
			.join('\n');

		return index < schema.length - 1 ? `${body},` : body;
	}

	type Token = { text: string; class?: string };

	// Just enough JSON highlighting for this payload: keys take the blue tint,
	// string values the sage one, everything else stays plain on-ink.
	const TOKEN = /"(?:[^"\\]|\\.)*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?/g;

	function tokenize(text: string): Token[] {
		const tokens: Token[] = [];
		let cursor = 0;

		for (const match of text.matchAll(TOKEN)) {
			const start = match.index ?? 0;
			if (start > cursor) {
				tokens.push({ text: text.slice(cursor, start) });
			}

			const isKey = match[0].endsWith(':');
			tokens.push({
				text: match[0],
				class: match[0].startsWith('"')
					? isKey
						? 'text-on-ink-blue'
						: 'text-on-ink-sage'
					: 'text-on-ink-faint'
			});
			cursor = start + match[0].length;
		}

		if (cursor < text.length) {
			tokens.push({ text: text.slice(cursor) });
		}

		return tokens;
	}

	// The example runs in an iframe, where the async clipboard API is often
	// unavailable; the textarea fallback still works there.
	function copyFallback(text: string): boolean {
		const scratch = document.createElement('textarea');
		scratch.value = text;
		scratch.setAttribute('readonly', '');
		scratch.style.position = 'fixed';
		scratch.style.opacity = '0';
		document.body.appendChild(scratch);
		scratch.select();

		let ok = false;
		try {
			ok = document.execCommand('copy');
		} catch {
			ok = false;
		}

		document.body.removeChild(scratch);
		return ok;
	}

	async function copySchema() {
		try {
			await navigator.clipboard.writeText(serialised);
		} catch {
			if (!copyFallback(serialised)) {
				return;
			}
		}

		copied = true;
		clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => (copied = false), 1200);
	}
</script>

<!-- The payoff panel sits on the dark field ground: it is a terminal, so it
     should read as one — a rounded card like every other, just inverted. -->
<section
	class="bg-field text-on-ink border-rule-soft shadow-card flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[14px] border sm:flex-1 lg:flex-1"
>
	<div class="border-blue/40 flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
		<span class="text-on-ink text-[11.5px] font-semibold">Schema · live</span>
		<div class="flex items-center gap-1">
			<span class="text-on-ink-faint hidden font-mono text-[10px] sm:inline">onLayoutChange</span>
			<Button
				variant="ghost"
				size="sm"
				class="text-on-ink-faint hover:bg-blue/20 hover:text-on-ink h-6 rounded-full px-2 text-xs"
				onclick={copySchema}
				disabled={fields.length === 0}
			>
				{#if copied}
					<Check class="size-3" />
					Copied
				{:else}
					Copy
				{/if}
			</Button>
		</div>
	</div>

	<!-- Output only. Clicking a block does not select its field: one pane is the
	     source, this one is the result. -->
	<div
		class="min-h-0 overflow-auto p-3 font-mono text-[10px] leading-relaxed max-lg:max-h-72 lg:flex-1 lg:text-[11px]"
	>
		{#if fields.length === 0}
			<pre class="text-on-ink-faint">[]</pre>
		{:else}
			<pre>[</pre>
			{#each fields as field, index (field.uid)}
				<pre
					class={cn(
						'border-l-2 border-transparent pl-2',
						field.uid === selectedUid && 'border-l-on-ink-blue'
					)}>{#each tokenize(block(index)) as token}<span class={token.class}>{token.text}</span
						>{/each}</pre>
			{/each}
			<pre>]</pre>
		{/if}
	</div>
</section>
