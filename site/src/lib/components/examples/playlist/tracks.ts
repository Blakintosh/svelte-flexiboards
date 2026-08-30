export type Track = {
	id: string;
	title: string;
	artist: string;
	seconds: number;
};

/** A fixed queue — the example never adds or removes, only reorders. */
export const TRACKS: Track[] = [
	{ id: 'weather-systems', title: 'Weather Systems', artist: 'Aurora Field', seconds: 252 },
	{ id: 'low-ceilings', title: 'Low Ceilings', artist: 'Marta Vane', seconds: 218 },
	{ id: 'north-pier', title: 'North Pier', artist: 'Halten', seconds: 304 },
	{ id: 'paper-mill', title: 'Paper Mill', artist: 'Aurora Field', seconds: 167 },
	{ id: 'slow-tide', title: 'Slow Tide', artist: 'Ivo Renn', seconds: 271 },
	{ id: 'blue-hour', title: 'Blue Hour', artist: 'Halten', seconds: 189 },
	{ id: 'drafting-table', title: 'Drafting Table', artist: 'Marta Vane', seconds: 382 },
	{ id: 'last-light', title: 'Last Light', artist: 'Ivo Renn', seconds: 235 }
];

export function formatDuration(seconds: number) {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
