import type { InternalFlexiBoardController } from '@flexiboards/core';
import { useId, type ReactNode } from 'react';

/**
 * Why a board's suspense fallback is being rendered.
 * - 'layout': a loadLayout/loadLayouts hasn't resolved yet, so the content
 *   itself is provisional, so the fallback shows at every viewport.
 * - 'breakpoint': only the server's breakpoint guess (`assumed`) is
 *   unconfirmed, so the fallback shows only where the viewport doesn't
 *   match the guess, via a media query the board generates itself.
 */
export type FlexiBoardSuspenseReason =
	| { reason: 'layout' }
	| { reason: 'breakpoint'; assumed: string };

type FlexiSuspenseBoundaryProps = {
	board: InternalFlexiBoardController;
	/** Why the fallback is showing; null renders the content plainly. */
	reason: FlexiBoardSuspenseReason | null;
	fallback: (reason: FlexiBoardSuspenseReason) => ReactNode;
	children: ReactNode;
};

/**
 * @internal The rendering half of FlexiBoard's suspense. The board's real
 * content lives in a layout-transparent `display: contents` wrapper — kept
 * mounted for the board's lifetime so resolving suspense never recreates the
 * targets — and the fallback sits beside it. Which one shows is decided
 * without JavaScript, so it holds from the very first server-rendered paint:
 *
 * - reason 'layout': inline styles alone toggle the pair.
 * - reason 'breakpoint': a <style> element whose `media` attribute carries
 *   the assumed breakpoint's viewport range flips both back inside that
 *   range; the !important is what lets it beat the inline styles.
 *
 * Once the reason resolves on the client, the fallback and style element
 * unmount and the inline styles return the content to display: contents.
 */
export function FlexiSuspenseBoundary({
	board,
	reason,
	fallback,
	children
}: FlexiSuspenseBoundaryProps) {
	const id = useId();

	// The assumed breakpoint's viewport range as a media condition, or null
	// when there is nothing to gate. Thresholds are coerced to numbers so
	// config values can't smuggle CSS into the media attribute.
	let mediaCondition: string | null = null;
	if (reason?.reason === 'breakpoint') {
		const range = board.breakpointRange(reason.assumed);
		if (range) {
			const parts = [
				range.minWidth !== undefined && `(min-width: ${Number(range.minWidth)}px)`,
				range.maxWidth !== undefined && `(max-width: ${Number(range.maxWidth) - 0.02}px)`
			].filter(Boolean);
			mediaCondition = parts.length ? parts.join(' and ') : null;
		}
	}

	// A breakpoint guess whose range covers every viewport (or an unknown key
	// with no range at all) is treated as confirmed rather than suspended.
	const suspended = reason !== null && (reason.reason === 'layout' || mediaCondition !== null);

	return (
		<>
			<div data-flexi-content={id} style={{ display: suspended ? 'none' : 'contents' }}>
				{children}
			</div>
			{suspended && reason && (
				<>
					{/* `inert` as a plain attribute so React 18 (no typed prop) emits it too. */}
					<div data-flexi-fallback={id} aria-hidden="true" {...({ inert: true } as object)}>
						{fallback(reason)}
					</div>
					{mediaCondition && (
						<style media={mediaCondition}>
							{`[data-flexi-content="${id}"] { display: contents !important; } [data-flexi-fallback="${id}"] { display: none !important; }`}
						</style>
					)}
				</>
			)}
		</>
	);
}
