<script module lang="ts">
	import type { InstallAction } from './package-manager.svelte';

	export type InstallStep = { action?: InstallAction; package: string };

	export type InstallCommandProps = {
		/** The package to add or remove, or the executable line for `dlx`. */
		package?: string;
		/** @default 'add' */
		action?: InstallAction;
		/** Several commands in one listing, one per line (e.g. remove the old package, add the new). */
		steps?: InstallStep[];
	};
</script>

<script lang="ts">
	import { commandFor, packageManager, packageManagers } from './package-manager.svelte';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import { copyText } from '$lib/copy-text';

	let { package: target, action = 'add', steps }: InstallCommandProps = $props();

	const lines = $derived(
		(steps ?? [{ action, package: target ?? '' }]).map((step) =>
			commandFor(packageManager.current, step.action ?? 'add', step.package)
		)
	);
	const command = $derived(lines.join('\n'));
	// The first word is the tool, the rest its arguments: the same two tones the
	// shiki blueprint theme gives shell listings elsewhere on the page.
	const split = (line: string) => {
		const [tool, ...rest] = line.split(' ');
		return { tool, rest: rest.join(' ') };
	};

	let copied = $state(false);
	async function copy() {
		copied = await copyText(command);
		setTimeout(() => (copied = false), 2000);
	}
</script>

<!-- A shell listing with the package manager as a tab strip: the choice is one
     preference for the whole site, so every listing follows it. Sized like the
     page's other listings (16px mono, generous inset) rather than the prose
     body it would otherwise inherit from. -->
<div class="not-prose border-ink bg-field my-6 border">
	<div
		class="border-on-ink-faint/30 flex items-center justify-between border-b pl-2 pr-1"
		role="tablist"
		aria-label="Package manager"
	>
		<div class="flex">
			{#each packageManagers as pm (pm)}
				<button
					type="button"
					role="tab"
					aria-selected={packageManager.current === pm}
					class="ui text-on-ink-faint hover:text-on-ink aria-selected:border-b-fx-accent aria-selected:text-on-ink relative -mb-px border-0 border-b-2 border-b-transparent bg-transparent px-3 py-2 font-mono text-[11px] leading-none transition-colors duration-[120ms]"
					onclick={() => (packageManager.current = pm)}
				>
					{pm}
				</button>
			{/each}
		</div>
		<button
			type="button"
			class="text-on-ink-faint hover:text-on-ink p-2 transition-colors duration-[120ms]"
			onclick={copy}
			aria-label="Copy command to clipboard"
		>
			{#if copied}<Check size={14} />{:else}<Copy size={14} />{/if}
		</button>
	</div>
	<pre
		class="shiki blueprint m-0 overflow-x-auto px-6 py-4 font-mono text-[16px] leading-7"
		style="background-color:#10202E;color:#DFE7EE"><code
			>{#each lines as line, i (i)}{@const parts = split(line)}<span class="line"
					><span style="color:#E2452B">{parts.tool}</span><span
						style="color:#C8E6A0"> {parts.rest}</span
					></span
				>{#if i < lines.length - 1}{'\n'}{/if}{/each}</code
		></pre>
</div>
