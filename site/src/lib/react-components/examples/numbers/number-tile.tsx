export type NumberTileProps = {
    number: number;
};

export function NumberTile({ number }: NumberTileProps) {
    // Numbers are mono, always. Placed widgets get a soft blue rule on tint.
    return <div
        className="flex h-full items-center justify-center rounded-[10px] border border-blue/30 bg-tint p-4 font-mono text-2xl text-blue"
    >
        {number}
    </div>;
}