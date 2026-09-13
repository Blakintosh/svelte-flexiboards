// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { InternalFlexiBoardController } from '../board/controller.js';

afterEach(() => {
	vi.unstubAllGlobals();
	document.body.innerHTML = '';
});

it('reserves destination content dimensions while retaining the release box for the flight', () => {
	vi.stubGlobal('requestAnimationFrame', () => 1);
	const board = new InternalFlexiBoardController({ config: {} }, null);
	board.ref = document.body;
	const target = board.createTarget(
		{ widgetDefaults: { transition: { drop: { duration: 200, easing: 'linear' } } } },
		'cards'
	);
	const grid = target.createGrid();
	grid.ref = document.createElement('div');
	document.body.append(grid.ref);
	const widget = target.createWidget({ x: 0, y: 0 })!;
	const element = document.createElement('div');
	widget.ref = element;
	element.style.cssText = 'position: absolute; left: 400px; top: 50px; width: 80px; height: 100px;';
	const releaseStyle = element.style.cssText;
	grid.ref.append(element);
	const placeholder = document.createElement('div');
	grid.ref.append(placeholder);
	element.getBoundingClientRect = () =>
		element.style.position === 'absolute'
			? new DOMRect(400, 50, 80, 100)
			: new DOMRect(0, 0, 240, 40);
	const interpolator = widget.interpolator;
	interpolator.interpolateMove(
		{ x: 0, y: 0, width: 1, height: 1 },
		new DOMRect(400, 50, 80, 100),
		'drop'
	);
	placeholder.style.cssText = interpolator.placeholderStyle$();
	interpolator.onPlaceholderMount(placeholder);

	expect(interpolator.placeholderStyle$()).toContain('min-width: 240px');
	expect(interpolator.placeholderStyle$()).toContain('min-height: 40px');
	expect(interpolator.widgetStyle$()).toContain('left: 400px');
	expect(interpolator.widgetStyle$()).toContain('height: 100px');
	expect(element.style.cssText).toBe(releaseStyle);
	expect(placeholder.style.display).not.toBe('none');
	interpolator.stop();
	interpolator.onPlaceholderUnmount();
	board.destroy();
});
