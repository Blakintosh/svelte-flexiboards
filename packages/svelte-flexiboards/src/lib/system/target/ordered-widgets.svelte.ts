import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';

/**
 * Maintains an always-sorted list of widgets (by y, then x) while preserving array identity.
 *
 * This helper mutates the provided backing array in-place and keeps an index map for O(1) lookups.
 */
export class OrderedWidgetList {
	#items: InternalFlexiWidgetController[];
	#index: Map<InternalFlexiWidgetController, number> = new Map();

	constructor(items: InternalFlexiWidgetController[]) {
		this.#items = items;
		this.#reindex(0);
	}

	clear() {
		this.#items.length = 0;
		this.#index.clear();
	}

	insert(widget: InternalFlexiWidgetController) {
		const insertAt = this.#upperBound(widget);
		this.#items.splice(insertAt, 0, widget);
		this.#reindex(insertAt);
	}

	remove(widget: InternalFlexiWidgetController): boolean {
		const mappedIndex = this.#index.get(widget);
		const index = mappedIndex ?? this.#items.indexOf(widget);
		if (index < 0) {
			return false;
		}
		this.#items.splice(index, 1);
		this.#index.delete(widget);
		this.#reindex(index);
		return true;
	}

	/**
	 * Relocate a widget to its correct sorted position if its (x,y) changed.
	 * Performs a fast neighbor check to avoid unnecessary work when order is unchanged.
	 */
	relocate(widget: InternalFlexiWidgetController) {
		const oldIndex = this.#index.get(widget);
		if (oldIndex === undefined) {
			// Not tracked yet; treat as insertion.
			this.insert(widget);
			return;
		}

		const prev = this.#items[oldIndex - 1];
		const next = this.#items[oldIndex + 1];
		const prevOk = !prev || this.#compare(prev, widget) <= 0;
		const nextOk = !next || this.#compare(widget, next) <= 0;
		if (prevOk && nextOk) {
			return; // Already in correct spot
		}

		this.#items.splice(oldIndex, 1);
		this.#reindex(oldIndex);
		const insertAt = this.#upperBound(widget);
		this.#items.splice(insertAt, 0, widget);
		this.#reindex(Math.min(insertAt, oldIndex));
	}

	#compare(a: InternalFlexiWidgetController, b: InternalFlexiWidgetController): number {
		if (a.y !== b.y) {
			return a.y - b.y;
		}
		return a.x - b.x;
	}

	// Find first index greater than the widget per comparator (upper bound)
	#upperBound(widget: InternalFlexiWidgetController): number {
		let low = 0;
		let high = this.#items.length;
		while (low < high) {
			const mid = (low + high) >> 1;
			const cmp = this.#compare(this.#items[mid]!, widget);
			if (cmp <= 0) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		return low;
	}

	#reindex(start: number) {
		for (let i = start; i < this.#items.length; i++) {
			this.#index.set(this.#items[i]!, i);
		}
	}
}
