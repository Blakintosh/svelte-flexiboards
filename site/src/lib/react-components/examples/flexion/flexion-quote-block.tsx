/** A note callout: 2px blue rule, tinted ground, softly rounded, never italic. */
export function FlexionQuoteBlock({ label, content }: { label?: string; content?: string }) {
	return (
		<blockquote className="border-blue bg-tint text-body max-w-[68ch] rounded-[10px] border-l-2 px-4 py-3 text-[13px] leading-relaxed lg:text-[13.5px]">
			{label && <strong className="text-ink">{label}</strong>} {content}
		</blockquote>
	);
}

export default FlexionQuoteBlock;
