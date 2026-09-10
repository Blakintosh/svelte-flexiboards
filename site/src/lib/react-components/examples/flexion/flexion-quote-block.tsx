/** A note callout: 2px blue rule, tinted ground, softly rounded, never italic. */
export function FlexionQuoteBlock({ label, content }: { label?: string; content?: string }) {
	return (
		<blockquote className="max-w-[68ch] rounded-[10px] border-l-2 border-blue bg-tint px-4 py-3 text-[13px] leading-relaxed text-body lg:text-[13.5px]">
			{label && <strong className="text-ink">{label}</strong>} {content}
		</blockquote>
	);
}

export default FlexionQuoteBlock;
