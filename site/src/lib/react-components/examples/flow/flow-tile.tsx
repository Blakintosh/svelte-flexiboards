export type FlowTileProps = {
    content: string;
};

export function FlowTile({ content }: FlowTileProps) {
    // A placed widget is board furniture: blue rule on tint, mono label.
    return <div
        className="label flex h-full items-center justify-center border border-blue bg-tint p-4 text-[11px] text-blue lg:text-[13px]">
        {content}
    </div>;
}