import { SunMedium } from 'lucide-react';
import { useState } from 'react';

/**
 * A gauge, softened into a pill: ink fill in a rounded trough. The Svelte
 * example uses bits-ui's Slider; there is no React equivalent in the site's
 * dependencies, so this is a native range input laid transparently over the
 * same visuals — same look, same keyboard behaviour, one element fewer.
 */
export default function BrightnessSlider() {
	const [value, setValue] = useState(80);

	return (
		<div className="w-full">
			<div className="relative mt-2.5 mb-1.5 flex w-full touch-none select-none items-center">
				<span className="relative h-[26px] w-full grow cursor-pointer overflow-hidden rounded-full border border-rule-soft bg-tint">
					<span className="bg-ink absolute h-full" style={{ width: `${value}%` }}></span>
					<span className="absolute left-0 top-0 text-paper p-[5px]">
						<SunMedium className="size-4" />
					</span>
				</span>
				<span
					className="bg-fx-accent pointer-events-none absolute block h-9 w-2 rounded-full transition-colors duration-[120ms]"
					style={{ left: `calc(${value}% - ${value * 0.08}px)` }}
				></span>
				<input
					type="range"
					min={0}
					max={100}
					value={value}
					aria-label="Brightness"
					onChange={(event) => setValue(Number(event.target.value))}
					className="focus-visible:outline-hidden absolute inset-0 h-full w-full cursor-pointer opacity-0"
				/>
			</div>
		</div>
	);
}
