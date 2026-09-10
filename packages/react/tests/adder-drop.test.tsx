import { describe, it, expect, afterEach, vi } from 'vitest';
import { FlexiAdd, FlexiBoard, FlexiTarget } from '../src/index.js';
import type { AdderWidgetConfiguration } from '../src/index.js';
import {
	flushTimers,
	keydown,
	layoutGrid,
	mount,
	pointerMove,
	pointerUp,
	portal,
	type Mounted
} from './helpers.js';

let mounted: Mounted | undefined;

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

const addWidget = (): AdderWidgetConfiguration => ({
	widget: { width: 1, height: 1 }
});

function AdderBoard() {
	return (
		<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
			<FlexiAdd addWidget={addWidget} className="adder">
				add
			</FlexiAdd>
			<FlexiTarget
				keyName="left"
				config={{
					layout: {
						type: 'free',
						minColumns: 3,
						maxColumns: 3,
						minRows: 3,
						maxRows: 3
					}
				}}
			/>
		</FlexiBoard>
	);
}

describe.each([{ strict: false }, { strict: true }])(
	'dropping a widget created by an adder (strict: $strict)',
	({ strict }) => {
		it('completes the drop without stranding the dragged element', () => {
			// Mirrors the Svelte regression test: the release must not throw
			// anywhere along the chain, and the portal must be empty afterwards.
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			mounted = mount(<AdderBoard />, { strict });

			const adder = document.querySelector<HTMLButtonElement>('button.adder');
			expect(adder).not.toBeNull();

			// Enter on the adder creates the widget and starts the drag-in on mount.
			keydown(adder!, 'Enter');

			expect(portal()).not.toBeNull();
			expect(portal()!.children.length).toBe(1);

			pointerUp();

			expect(portal()!.children.length).toBe(0);
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it('places the dropped widget in the hovered target and leaves nothing behind after the sweep', async () => {
			mounted = mount(<AdderBoard />, { strict });
			const adder = document.querySelector<HTMLButtonElement>('button.adder')!;
			const grid = document.querySelector<HTMLElement>('[role="grid"]')!;

			layoutGrid();
			// Start with the pointer outside the target, as it would be over a real adder.
			pointerMove(-50, -50);
			keydown(adder, 'Enter');
			// Carry the new widget over the target and release it there.
			pointerMove(50, 50);
			pointerUp();
			await flushTimers();

			// The widget now belongs to the target and renders as a grid cell.
			expect(grid.querySelectorAll('[role="cell"]').length).toBe(1);
			// The orphan sweep must not have removed the re-parented node.
			expect(portal()!.children.length).toBe(0);
			expect(document.querySelectorAll('[role="cell"]').length).toBe(1);
		});
	}
);
