export function FlexionHeadingBlock({ content = 'Heading' }: { content?: string }) {
	return <h3 className="text-ink font-serif text-xl lg:text-[20px]">{content}</h3>;
}

export default FlexionHeadingBlock;
