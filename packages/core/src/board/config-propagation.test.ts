import { describe, it, expect } from 'vitest';
import { InternalFlexiBoardController } from './controller.js';
import { effect } from '../reactivity.js';

/**
 * Regression coverage for the adapter prop seam. Config used to be captured once
 * at construction, so a board whose widgetDefaults changed (e.g. an edit-mode
 * toggle) never propagated to its widgets and grab/resize handles never appeared.
 */
describe('board config propagation', () => {
	const setup = (config: any) => {
		const board = new InternalFlexiBoardController({ config } as any, null);
		const target = board.createTarget(
			{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 4 } } as any,
			'left'
		);
		target.createGrid();
		const widget = target.createWidget({ x: 0, y: 0, width: 1, height: 1 } as any)!;

		return { board, target, widget };
	};

	it('propagates board widgetDefaults through to widget draggability', () => {
		const config: any = { widgetDefaults: { draggability: 'none', resizability: 'none' } };
		const { board, widget } = setup(config);

		expect(widget.isGrabbable).toBe(false);
		expect(widget.resizable).toBe(false);

		config.widgetDefaults = { draggability: 'full', resizability: 'horizontal' };
		board.updateProps({ config } as any);

		expect(widget.isGrabbable).toBe(true);
		expect(widget.resizable).toBe(true);

		config.widgetDefaults = { draggability: 'none', resizability: 'none' };
		board.updateProps({ config } as any);

		expect(widget.isGrabbable).toBe(false);
		expect(widget.resizable).toBe(false);
	});

	it('propagates target config changes', () => {
		const { target } = setup({});

		expect(target.config.rowSizing).toBe('minmax(1rem, auto)');

		target.updateConfig({ rowSizing: 'minmax(0, 180px)' } as any);

		expect(target.config.rowSizing).toBe('minmax(0, 180px)');
	});

	it('re-running the seam with unchanged config never invalidates', () => {
		const config: any = { widgetDefaults: { draggability: 'none' } };
		const { board, target, widget } = setup(config);

		let boardRuns = 0;
		let widgetRuns = 0;
		effect(() => {
			board.config$();
			boardRuns++;
		});
		effect(() => {
			widget.draggability;
			widgetRuns++;
		});

		// An adapter effect can re-run for reasons unrelated to config (snippet or
		// inline-literal identity churn). Those passes must be completely inert,
		// otherwise the invalidation they cause can re-enter the effect.
		for (let i = 0; i < 100; i++) {
			board.updateProps({ config: { widgetDefaults: { draggability: 'none' } } } as any);
			target.updateConfig({
				layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 4 }
			} as any);
			widget.updateConfig({ x: 0, y: 0, width: 1, height: 1 } as any);
		}

		expect(boardRuns).toBe(1);
		expect(widgetRuns).toBe(1);
	});
});

describe('widget config seam', () => {
	const makeWidget = (widgetDefaults?: any, widgetConfig?: any) => {
		const board = new InternalFlexiBoardController({ config: { widgetDefaults } } as any, null);
		const target = board.createTarget(
			{ layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 4 } } as any,
			'left'
		);
		target.createGrid();

		return target.createWidget({ x: 0, y: 0, width: 1, height: 1, ...widgetConfig } as any)!;
	};

	it('applies changed props', () => {
		const widget = makeWidget();

		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1 } as any);
		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, draggability: 'full' } as any);

		expect(widget.draggability).toBe('full');
	});

	it('propagates a changed class prop', () => {
		// The adapter passes the same config object to creation and to the first
		// sync, so mirror that: creation applies it, the first sync is a baseline.
		const widget = makeWidget(undefined, { className: 'a' });

		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, className: 'a' } as any);
		expect(widget.className).toBe('a');

		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, className: 'b' } as any);
		expect(widget.className).toBe('b');
	});

	it('compares array class props by value, not identity', () => {
		const widget = makeWidget(undefined, { className: ['a', 'b'] });

		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, className: ['a', 'b'] } as any);

		let runs = 0;
		effect(() => {
			widget.className;
			runs++;
		});
		expect(runs).toBe(1);

		// A fresh array with identical contents — an inline `class={['a','b']}`
		// re-created on each render — must not invalidate.
		for (let i = 0; i < 20; i++) {
			widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, className: ['a', 'b'] } as any);
		}
		expect(runs).toBe(1);

		// A genuine change still lands.
		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, className: ['a', 'c'] } as any);
		expect(runs).toBe(2);
		expect(widget.className).toEqual(['a', 'c']);
	});

	it('falls back to widgetDefaults class until a class prop overrides it', () => {
		const widget = makeWidget({ className: 'from-defaults' });

		// First sync only records a baseline, so registry/board defaults survive.
		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1 } as any);
		expect(widget.className).toBe('from-defaults');

		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, className: 'from-prop' } as any);
		expect(widget.className).toBe('from-prop');
	});

	it('propagates a swapped snippet, and is inert while it is unchanged', () => {
		// Snippet declarations are stable consts (component setup runs once), so
		// identity comparison is meaningful here rather than churning.
		const a = (() => {}) as any;
		const b = (() => {}) as any;

		const widget = makeWidget(undefined, { snippet: a });
		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, snippet: a } as any);

		let runs = 0;
		effect(() => {
			widget.snippet;
			runs++;
		});
		expect(runs).toBe(1);

		for (let i = 0; i < 20; i++) {
			widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, snippet: a } as any);
		}
		expect(runs).toBe(1);
		expect(widget.snippet).toBe(a);

		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, snippet: b } as any);
		expect(runs).toBe(2);
		expect(widget.snippet).toBe(b);
	});

	it('does not clobber imperatively set state on an unrelated prop change', () => {
		const widget = makeWidget();

		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1 } as any);

		// Set imperatively rather than through props.
		widget.draggability = 'full';
		expect(widget.draggability).toBe('full');

		// A prop change elsewhere must leave the imperative value alone.
		widget.updateConfig({ x: 0, y: 0, width: 1, height: 1, metadata: { a: 1 } } as any);

		expect(widget.draggability).toBe('full');
	});
});
