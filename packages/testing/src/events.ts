import { run } from './configure.js';

export function keydown(target: EventTarget, key: string) {
	run(() => {
		target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
	});
}

export type PointerOptions = { pointerType?: 'mouse' | 'touch' | 'pen'; button?: number };

/** A left-button press on an element (a widget, grab handle, or resize handle). */
export function pointerDown(
	target: EventTarget,
	clientX: number,
	clientY: number,
	{ pointerType = 'mouse', button = 0 }: PointerOptions = {}
) {
	run(() => {
		target.dispatchEvent(
			new PointerEvent('pointerdown', {
				clientX,
				clientY,
				pointerType,
				button,
				isPrimary: true,
				bubbles: true
			})
		);
	});
}

/** Moves the pointer; core tracks it on the window while a widget is grabbed. */
export function pointerMove(clientX: number, clientY: number) {
	run(() => {
		window.dispatchEvent(new PointerEvent('pointermove', { clientX, clientY, bubbles: true }));
	});
}

/**
 * Releases the pointer; the board turns this into a drop. Dispatched on the
 * document so it bubbles to the window, where the board listens, after the
 * trigger's own document listener.
 */
export function pointerUp() {
	run(() => {
		document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
	});
}

/**
 * Picks a widget up by keyboard. Focus the widget (or its grab handle) and
 * press Enter; the widget then follows the arrow keys and the pointer.
 */
export function grabByKeyboard(target: EventTarget) {
	keydown(target, 'Enter');
}

/** Drops a keyboard-grabbed widget where it is. */
export function dropByKeyboard() {
	keydown(window, 'Enter');
}

/** Cancels the grab in progress and sends the widget home. */
export function cancelGrab() {
	keydown(window, 'Escape');
}

/** Moves a keyboard-grabbed widget one cell at a time. */
export function arrow(...keys: ('ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight')[]) {
	for (const key of keys) keydown(window, key);
}

/**
 * The whole pointer gesture: press on `target`, move to `(x, y)`, release.
 * Assumes the widget's trigger is immediate (the default); for a long-press
 * trigger, drive `pointerDown` and fake timers yourself.
 */
export function dragTo(
	target: EventTarget,
	x: number,
	y: number,
	{ from = { x: 0, y: 0 }, ...options }: PointerOptions & { from?: { x: number; y: number } } = {}
) {
	pointerDown(target, from.x, from.y, options);
	pointerMove(x, y);
	pointerUp();
}
