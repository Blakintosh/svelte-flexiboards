import { Check, Copy, RotateCcw } from 'lucide-react';
import { Fragment, useEffect, useRef } from 'react';
import Button from '../common/button';

export type CopyState = 'idle' | 'copied' | 'failed';

export type LayoutJsonBarProps = {
	json: string;
	copyState: CopyState;
	/** Layout id of the tile currently in hand, if any — its x/y are marked. */
	highlightId?: string;
	onCopy: () => void;
	onReset: () => void;
};

// The coordinate pair inside one entry, so only the numbers that move get the
// accent — the rest of the line stays in the resting listing colour.
const XY = /("x": -?\d+, "y": -?\d+)/;

/*
	Docked to the bottom of the frame on the terminal ground: `bg-field` stays dark
	in both themes, so the listing reads as output rather than as more page.
*/
export default function LayoutJsonBar({
	json,
	copyState,
	highlightId,
	onCopy,
	onReset
}: LayoutJsonBarProps) {
	const listing = useRef<HTMLPreElement | null>(null);
	const handledFailure = useRef(false);

	const copyLabel = copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Select' : 'Copy';

	const lines = json.split('\n').map((text) => {
		if (!highlightId || !text.includes(`"id": "${highlightId}"`)) {
			return { text, before: '', xy: '', after: '' };
		}
		const match = XY.exec(text);
		if (!match) return { text, before: '', xy: '', after: '' };
		return {
			text,
			before: text.slice(0, match.index),
			xy: match[1],
			after: text.slice(match.index + match[1].length)
		};
	});

	// Clipboard writes can be refused. When that happens the listing takes focus with
	// its text selected, so the layout can still be copied by hand — an invisible
	// action must never fail silently.
	useEffect(() => {
		if (copyState !== 'failed') {
			handledFailure.current = false;
			return;
		}
		if (handledFailure.current || !listing.current) return;

		handledFailure.current = true;
		listing.current.focus();

		const selection = window.getSelection();
		if (!selection) return;
		const range = document.createRange();
		range.selectNodeContents(listing.current);
		selection.removeAllRanges();
		selection.addRange(range);
	}, [copyState]);

	return (
		<div className="bg-field flex shrink-0 flex-col gap-1.5 px-4 py-2.5">
			<div className="flex items-center justify-between gap-4">
				<span className="label text-on-ink text-[10px]">Layout · live JSON</span>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="text-on-ink-blue hover:text-on-ink h-7 rounded-none px-2 text-xs underline underline-offset-4 hover:bg-transparent"
						title="Copy exportLayout() output to the clipboard"
						onClick={onCopy}
					>
						{copyState === 'copied' ? (
							<Check className="size-3.5" />
						) : (
							<Copy className="size-3.5" />
						)}
						{copyLabel}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="text-on-ink-faint hover:text-on-ink h-7 rounded-none px-2 text-xs hover:bg-transparent"
						title="Restore the seeded layout for every breakpoint"
						onClick={onReset}
					>
						<RotateCcw className="size-3.5" />
						Reset
					</Button>
				</div>
			</div>

			{/*
				Focusable on purpose: it is a scrollable region (WCAG 2.1.1) and the
				manual-copy fallback focuses it to select the layout.
			*/}
			<pre
				ref={listing}
				tabIndex={0}
				aria-label="Live responsive layout JSON"
				className="text-on-ink-faint focus-visible:outline-fx-accent max-h-[16vh] overflow-auto whitespace-pre font-mono text-[10.5px] leading-[1.6] focus-visible:outline-2 focus-visible:-outline-offset-2"
			>
				{lines.map((line, i) => (
					<Fragment key={i}>
						{line.xy ? (
							<>
								{line.before}
								<span className="text-on-ink-sage">{line.xy}</span>
								{line.after}
							</>
						) : (
							line.text
						)}
						{i < lines.length - 1 ? '\n' : ''}
					</Fragment>
				))}
			</pre>
		</div>
	);
}
