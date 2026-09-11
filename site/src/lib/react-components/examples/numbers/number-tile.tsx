export type NumberTileProps = {
	number: number;
};

export function NumberTile({ number }: NumberTileProps) {
	// Numbers stay mono. Placed widgets get a soft blue rule on tint.
	return (
		<div className="border-blue/30 bg-tint text-blue flex h-full items-center justify-center rounded-[10px] border p-4 font-mono text-2xl">
			{number}
		</div>
	);
}
