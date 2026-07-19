import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { FlexiWidgetLayoutEntry } from '../board/types.js';
import type { FlexiRegistryEntry } from '../board/types.js';

/**
 * Tests for import/export functionality.
 *
 * Since the actual InternalFlexiTargetController has many dependencies (Svelte context, etc.),
 * we test the logic by creating minimal mock implementations that mirror the behavior.
 */

type MockWidget = {
	id: string;
	type?: string;
	userProvidedId?: string;
	x: number;
	y: number;
	width: number;
	height: number;
	metadata?: Record<string, unknown>;
};

type MockRegistry = Record<string, FlexiRegistryEntry>;

/**
 * Simulates the importLayout logic from InternalFlexiTargetController
 */
function importLayout(
	layout: FlexiWidgetLayoutEntry[],
	registry: MockRegistry | undefined,
	widgets: Map<string, MockWidget>,
	warnFn: (msg: string, ...args: unknown[]) => void
): void {
	if (!registry) {
		warnFn('importLayout(): no registry provided, cannot import layout. Provide a registry to the FlexiBoard component.');
		return;
	}

	widgets.clear();

	for (const entry of layout) {
		if (!entry.type) {
			warnFn('importLayout(): skipping widget entry with no type:', entry);
			continue;
		}

		if (!registry[entry.type]) {
			warnFn(`importLayout(): widget type "${entry.type}" not found in registry, skipping widget.`);
			continue;
		}

		// Simulate createWidget
		const widget: MockWidget = {
			id: entry.id ?? `widget-${Math.random().toString(36).substring(2, 9)}`,
			type: entry.type,
			userProvidedId: entry.id,
			x: entry.x,
			y: entry.y,
			width: entry.width,
			height: entry.height,
			metadata: entry.metadata
		};

		widgets.set(widget.id, widget);
	}
}

/**
 * Simulates the exportLayout logic from InternalFlexiTargetController
 */
function exportLayout(
	widgets: Map<string, MockWidget>,
	warnFn: (msg: string, ...args: unknown[]) => void
): FlexiWidgetLayoutEntry[] {
	const result: FlexiWidgetLayoutEntry[] = [];

	for (const widget of widgets.values()) {
		if (!widget.type) {
			warnFn('exportLayout(): widget has no type, it will be skipped.');
			continue;
		}

		const entry: FlexiWidgetLayoutEntry = {
			type: widget.type,
			width: widget.width,
			height: widget.height,
			x: widget.x,
			y: widget.y,
			metadata: widget.metadata
		};

		// Only include id if user provided one
		if (widget.userProvidedId) {
			entry.id = widget.userProvidedId;
		}

		result.push(entry);
	}

	return result;
}

describe('Import/Export Layout', () => {
	let widgets: Map<string, MockWidget>;
	let warnSpy: ReturnType<typeof vi.fn>;
	let originalWarn: typeof console.warn;

	beforeEach(() => {
		widgets = new Map();
		warnSpy = vi.fn();
		originalWarn = console.warn;
		console.warn = warnSpy;
	});

	afterEach(() => {
		console.warn = originalWarn;
	});

	describe('importLayout', () => {
		it('should import widgets from a valid layout', () => {
			const registry: MockRegistry = {
				'widget-a': { snippet: {} as any },
				'widget-b': { snippet: {} as any }
			};

			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'widget-a', x: 0, y: 0, width: 1, height: 1 },
				{ type: 'widget-b', x: 1, y: 0, width: 2, height: 2 }
			];

			importLayout(layout, registry, widgets, warnSpy);

			expect(widgets.size).toBe(2);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should preserve widget positions and dimensions', () => {
			const registry: MockRegistry = {
				'test-widget': { snippet: {} as any }
			};

			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'test-widget', x: 5, y: 3, width: 4, height: 2 }
			];

			importLayout(layout, registry, widgets, warnSpy);

			const widget = Array.from(widgets.values())[0];
			expect(widget.x).toBe(5);
			expect(widget.y).toBe(3);
			expect(widget.width).toBe(4);
			expect(widget.height).toBe(2);
		});

		it('should preserve user-provided widget IDs', () => {
			const registry: MockRegistry = {
				'test-widget': { snippet: {} as any }
			};

			const layout: FlexiWidgetLayoutEntry[] = [
				{ id: 'my-custom-id', type: 'test-widget', x: 0, y: 0, width: 1, height: 1 }
			];

			importLayout(layout, registry, widgets, warnSpy);

			const widget = widgets.get('my-custom-id');
			expect(widget).toBeDefined();
			expect(widget?.userProvidedId).toBe('my-custom-id');
		});

		it('should preserve metadata', () => {
			const registry: MockRegistry = {
				'test-widget': { snippet: {} as any }
			};

			const metadata = { title: 'Test Widget', config: { theme: 'dark' } };
			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'test-widget', x: 0, y: 0, width: 1, height: 1, metadata }
			];

			importLayout(layout, registry, widgets, warnSpy);

			const widget = Array.from(widgets.values())[0];
			expect(widget.metadata).toEqual(metadata);
		});

		it('should warn and return early when no registry is provided', () => {
			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'test-widget', x: 0, y: 0, width: 1, height: 1 }
			];

			importLayout(layout, undefined, widgets, warnSpy);

			expect(widgets.size).toBe(0);
			expect(warnSpy).toHaveBeenCalledWith(
				'importLayout(): no registry provided, cannot import layout. Provide a registry to the FlexiBoard component.'
			);
		});

		it('should skip widgets with missing type and warn', () => {
			const registry: MockRegistry = {
				'valid-widget': { snippet: {} as any }
			};

			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'valid-widget', x: 0, y: 0, width: 1, height: 1 },
				{ type: '', x: 1, y: 0, width: 1, height: 1 } as FlexiWidgetLayoutEntry,
				{ x: 2, y: 0, width: 1, height: 1 } as FlexiWidgetLayoutEntry
			];

			importLayout(layout, registry, widgets, warnSpy);

			expect(widgets.size).toBe(1);
			expect(warnSpy).toHaveBeenCalledTimes(2);
		});

		it('should skip widgets with type not in registry and warn', () => {
			const registry: MockRegistry = {
				'known-widget': { snippet: {} as any }
			};

			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'known-widget', x: 0, y: 0, width: 1, height: 1 },
				{ type: 'unknown-widget', x: 1, y: 0, width: 1, height: 1 }
			];

			importLayout(layout, registry, widgets, warnSpy);

			expect(widgets.size).toBe(1);
			expect(warnSpy).toHaveBeenCalledWith(
				'importLayout(): widget type "unknown-widget" not found in registry, skipping widget.'
			);
		});

		it('should clear existing widgets before importing', () => {
			const registry: MockRegistry = {
				'new-widget': { snippet: {} as any }
			};

			// Pre-populate with existing widgets
			widgets.set('existing-1', { id: 'existing-1', type: 'old', x: 0, y: 0, width: 1, height: 1 });
			widgets.set('existing-2', { id: 'existing-2', type: 'old', x: 1, y: 0, width: 1, height: 1 });

			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'new-widget', x: 0, y: 0, width: 1, height: 1 }
			];

			importLayout(layout, registry, widgets, warnSpy);

			expect(widgets.size).toBe(1);
			expect(widgets.has('existing-1')).toBe(false);
			expect(widgets.has('existing-2')).toBe(false);
		});

		it('should handle empty layout', () => {
			const registry: MockRegistry = {
				'test-widget': { snippet: {} as any }
			};

			importLayout([], registry, widgets, warnSpy);

			expect(widgets.size).toBe(0);
			expect(warnSpy).not.toHaveBeenCalled();
		});

		it('should continue importing valid widgets after encountering invalid ones', () => {
			const registry: MockRegistry = {
				'valid-a': { snippet: {} as any },
				'valid-b': { snippet: {} as any }
			};

			const layout: FlexiWidgetLayoutEntry[] = [
				{ type: 'valid-a', x: 0, y: 0, width: 1, height: 1 },
				{ type: 'invalid', x: 1, y: 0, width: 1, height: 1 },
				{ type: 'valid-b', x: 2, y: 0, width: 1, height: 1 }
			];

			importLayout(layout, registry, widgets, warnSpy);

			expect(widgets.size).toBe(2);
			const types = Array.from(widgets.values()).map(w => w.type);
			expect(types).toContain('valid-a');
			expect(types).toContain('valid-b');
		});
	});

	describe('exportLayout', () => {
		it('should export widgets with their positions and dimensions', () => {
			widgets.set('w1', { id: 'w1', type: 'widget-a', x: 0, y: 0, width: 1, height: 1 });
			widgets.set('w2', { id: 'w2', type: 'widget-b', x: 2, y: 1, width: 3, height: 2 });

			const layout = exportLayout(widgets, warnSpy);

			expect(layout).toHaveLength(2);
			expect(layout).toContainEqual({
				type: 'widget-a',
				x: 0,
				y: 0,
				width: 1,
				height: 1,
				metadata: undefined
			});
			expect(layout).toContainEqual({
				type: 'widget-b',
				x: 2,
				y: 1,
				width: 3,
				height: 2,
				metadata: undefined
			});
		});

		it('should include user-provided IDs in export', () => {
			widgets.set('custom-id', {
				id: 'custom-id',
				type: 'test-widget',
				userProvidedId: 'custom-id',
				x: 0,
				y: 0,
				width: 1,
				height: 1
			});

			const layout = exportLayout(widgets, warnSpy);

			expect(layout[0].id).toBe('custom-id');
		});

		it('should not include auto-generated IDs in export', () => {
			widgets.set('auto-generated-123', {
				id: 'auto-generated-123',
				type: 'test-widget',
				// No userProvidedId
				x: 0,
				y: 0,
				width: 1,
				height: 1
			});

			const layout = exportLayout(widgets, warnSpy);

			expect(layout[0].id).toBeUndefined();
		});

		it('should preserve metadata in export', () => {
			const metadata = { title: 'My Widget', settings: { enabled: true } };
			widgets.set('w1', {
				id: 'w1',
				type: 'test-widget',
				x: 0,
				y: 0,
				width: 1,
				height: 1,
				metadata
			});

			const layout = exportLayout(widgets, warnSpy);

			expect(layout[0].metadata).toEqual(metadata);
		});

		it('should skip widgets without type and warn', () => {
			widgets.set('w1', { id: 'w1', type: 'valid-type', x: 0, y: 0, width: 1, height: 1 });
			widgets.set('w2', { id: 'w2', x: 1, y: 0, width: 1, height: 1 }); // No type

			const layout = exportLayout(widgets, warnSpy);

			expect(layout).toHaveLength(1);
			expect(layout[0].type).toBe('valid-type');
			expect(warnSpy).toHaveBeenCalledWith('exportLayout(): widget has no type, it will be skipped.');
		});

		it('should handle empty widget collection', () => {
			const layout = exportLayout(widgets, warnSpy);

			expect(layout).toHaveLength(0);
			expect(warnSpy).not.toHaveBeenCalled();
		});
	});

	describe('round-trip (export then import)', () => {
		it('should preserve layout through export and import cycle', () => {
			const registry: MockRegistry = {
				'widget-a': { snippet: {} as any },
				'widget-b': { snippet: {} as any }
			};

			// Set up initial widgets
			widgets.set('w1', {
				id: 'user-id-1',
				type: 'widget-a',
				userProvidedId: 'user-id-1',
				x: 0,
				y: 0,
				width: 2,
				height: 1,
				metadata: { title: 'Widget A' }
			});
			widgets.set('w2', {
				id: 'w2',
				type: 'widget-b',
				x: 2,
				y: 1,
				width: 1,
				height: 3,
				metadata: { config: { value: 42 } }
			});

			// Export
			const exported = exportLayout(widgets, warnSpy);

			// Clear and import back
			widgets.clear();
			importLayout(exported, registry, widgets, warnSpy);

			// Verify
			expect(widgets.size).toBe(2);

			// Find widget by user-provided ID
			const widgetA = widgets.get('user-id-1');
			expect(widgetA).toBeDefined();
			expect(widgetA?.type).toBe('widget-a');
			expect(widgetA?.x).toBe(0);
			expect(widgetA?.y).toBe(0);
			expect(widgetA?.width).toBe(2);
			expect(widgetA?.height).toBe(1);
			expect(widgetA?.metadata).toEqual({ title: 'Widget A' });

			// Find widget-b (auto-generated ID won't match)
			const allWidgets = Array.from(widgets.values());
			const widgetB = allWidgets.find(w => w.type === 'widget-b');
			expect(widgetB).toBeDefined();
			expect(widgetB?.x).toBe(2);
			expect(widgetB?.y).toBe(1);
			expect(widgetB?.width).toBe(1);
			expect(widgetB?.height).toBe(3);
			expect(widgetB?.metadata).toEqual({ config: { value: 42 } });
		});

		it('should handle multiple export/import cycles', () => {
			const registry: MockRegistry = {
				'persistent-widget': { snippet: {} as any }
			};

			const originalLayout: FlexiWidgetLayoutEntry[] = [
				{
					id: 'stable-id',
					type: 'persistent-widget',
					x: 5,
					y: 10,
					width: 3,
					height: 2,
					metadata: { iteration: 0 }
				}
			];

			// First import
			importLayout(originalLayout, registry, widgets, warnSpy);
			let exported = exportLayout(widgets, warnSpy);

			// Second cycle
			widgets.clear();
			importLayout(exported, registry, widgets, warnSpy);
			exported = exportLayout(widgets, warnSpy);

			// Third cycle
			widgets.clear();
			importLayout(exported, registry, widgets, warnSpy);
			const finalExport = exportLayout(widgets, warnSpy);

			// Verify final state matches original
			expect(finalExport).toHaveLength(1);
			expect(finalExport[0]).toEqual({
				id: 'stable-id',
				type: 'persistent-widget',
				x: 5,
				y: 10,
				width: 3,
				height: 2,
				metadata: { iteration: 0 }
			});
		});
	});
});
