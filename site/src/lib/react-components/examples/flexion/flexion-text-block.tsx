export function FlexionTextBlock({ content }: { content?: string }) {
	return (
		<p className="max-w-[68ch] text-[13px] leading-relaxed text-body lg:text-[14.5px]">{content}</p>
	);
}

export default FlexionTextBlock;
