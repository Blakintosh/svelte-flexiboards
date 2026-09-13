export function FlexionTextBlock({ content }: { content?: string }) {
	return (
		<p className="text-body max-w-[68ch] text-[13px] leading-relaxed lg:text-[14.5px]">{content}</p>
	);
}

export default FlexionTextBlock;
