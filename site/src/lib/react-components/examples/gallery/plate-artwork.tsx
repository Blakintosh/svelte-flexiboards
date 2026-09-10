import { plateStyle } from './plates';
import type { Motif } from './plates';

export type PlateArtworkProps = {
	motif: Motif;
	pair: number;
};

/** The print itself: gradients only, no images and no assets. */
export default function PlateArtwork({ motif, pair }: PlateArtworkProps) {
	return <div className="h-full w-full" style={plateStyle(motif, pair)} aria-hidden="true"></div>;
}
