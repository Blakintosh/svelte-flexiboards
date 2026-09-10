<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { InternalFlexiBoardController } from '@flexiboards/core';
	import type { FlexiBoardSuspenseReason } from './flexi-board.svelte';

	export type FlexiSuspenseBoundaryProps = {
		board: InternalFlexiBoardController;
		/** Why the fallback is showing; null renders the content plainly. */
		reason: FlexiBoardSuspenseReason | null;
		fallback: Snippet<[FlexiBoardSuspenseReason]>;
		children: Snippet;
	};
</script>

<script lang="ts">
	/*
	  Internal: the rendering half of FlexiBoard's suspense. The board's real
	  content lives in a layout-transparent `display: contents` wrapper — kept
	  mounted for the board's lifetime so resolving suspense never recreates
	  the targets — and the fallback sits beside it. Which one shows is decided
	  without JavaScript, so it holds from the very first server-rendered paint:

	  - reason 'layout': the content is provisional at every viewport. Inline
	    styles alone toggle the pair.
	  - reason 'breakpoint': the server's breakpoint guess is unconfirmed, and
	    whether it matched is a media-query decision. The suspended state is
	    still inline; a <style> element whose `media` attribute carries the
	    assumed breakpoint's viewport range (derived from the breakpoints
	    config) flips both elements back inside that range. The !important is
	    what lets the sheet beat the inline styles there.

	  Once the reason resolves on the client, the fallback and style element
	  unmount and the inline styles return the content to display: contents.
	*/

	let { board, reason, fallback, children }: FlexiSuspenseBoundaryProps = $props();

	const id = $props.id();

	// The assumed breakpoint's viewport range as a media condition, or null
	// when there is nothing to gate. Thresholds are coerced to numbers so
	// config values can't smuggle CSS into the media attribute.
	const mediaCondition = $derived.by(() => {
		if (reason?.reason !== 'breakpoint') {
			return null;
		}
		const range = board.breakpointRange(reason.assumed);
		if (!range) {
			return null;
		}
		const parts = [
			range.minWidth !== undefined && `(min-width: ${Number(range.minWidth)}px)`,
			range.maxWidth !== undefined && `(max-width: ${Number(range.maxWidth) - 0.02}px)`
		].filter(Boolean);
		return parts.length ? parts.join(' and ') : null;
	});

	// A breakpoint guess whose range covers every viewport (or an unknown key
	// with no range at all — nothing sensible to gate on) is treated as
	// confirmed rather than suspended.
	const suspended = $derived(
		reason !== null && (reason.reason === 'layout' || mediaCondition !== null)
	);
</script>

<div data-flexi-content={id} style={suspended ? 'display: none;' : 'display: contents;'}>
	{@render children()}
</div>

{#if suspended && reason}
	<div data-flexi-fallback={id} inert aria-hidden="true">
		{@render fallback(reason)}
	</div>
	{#if mediaCondition}
		<!-- svelte:element rather than a literal style tag: preprocessors
		     treat any literal <style> in the source as component CSS. -->
		<svelte:element this={'style'} media={mediaCondition}>
			{`[data-flexi-content="${id}"] { display: contents !important; } [data-flexi-fallback="${id}"] { display: none !important; }`}
		</svelte:element>
	{/if}
{/if}
