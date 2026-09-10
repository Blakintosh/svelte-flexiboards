export function FlexionHeadingBlock({ content = 'Heading' }: { content?: string }) {
	return <h3 className="font-serif text-xl text-ink lg:text-[20px]">{content}</h3>;
}

export default FlexionHeadingBlock;
