import type { InternalWidgetEvent } from '../internal-types.js';
import type { Position, Signal } from '../types.js';
import type { FlexiGrid } from '../grid/base.js';
import type { FlexiTargetConfiguration } from '../target/types.js';
import { getFlexiEventBus, type FlexiEventBus } from './event-bus.js';
import { effect, signal, trigger, untracked } from '../reactivity.js';

/**
 * A singleton service that globally tracks the current position of the pointer.
 */
export class PointerService {
	#position$: Signal<Position> = signal({
		x: 0,
		y: 0
	});
	#keyboardController: KeyboardPointerController;
	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

	constructor() {
		this.#keyboardController = new KeyboardPointerController(this);
		this.#eventBus = getFlexiEventBus();

		if (typeof window === 'undefined') {
			return;
		}

		const updatePosition = this.updatePosition.bind(this);

		const onPointerMove = (event: PointerEvent) => {
			updatePosition(event.clientX, event.clientY);
		};

		// As this is singleton, we'll reuse it for the duration of the browser session
		// (ie no disposal)
		window.addEventListener('pointermove', onPointerMove);

		this.#unsubscribers.push(
			this.#eventBus.subscribe('widget:grabbed', this.enableKeyboardControls.bind(this)),
			this.#eventBus.subscribe('widget:resizing', this.enableKeyboardControls.bind(this)),
			this.#eventBus.subscribe('widget:release', this.disableKeyboardControls.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.disableKeyboardControls.bind(this))
		);
	}

	updatePosition(clientX: number, clientY: number) {
		const position = this.#position$();
		position.x = clientX;
		position.y = clientY;
		// Re-trigger reactivity manually.
		trigger(() => this.#position$());

		this.#eventBus.dispatch('pointer:moved', {
			x: clientX,
			y: clientY
		});
	}

	enableKeyboardControls() {
		this.#keyboardController.active = true;
	}

	disableKeyboardControls() {
		this.#keyboardController.active = false;
	}

	/**
	 * Utility method to check if the pointer is inside an element.
	 * @param element The element to check if the pointer is inside.
	 * @returns True if the pointer is inside the element, false otherwise.
	 */
	isPointerInside(element: HTMLElement) {
		const rect = element.getBoundingClientRect();

		const { x, y } = this.#position$();

		// Use scrollWidth/scrollHeight to account for content that overflows the element
		// (e.g. grid columns that extend beyond a scrollable parent with overflow: hidden).
		const width = Math.max(rect.width, element.scrollWidth);
		const height = Math.max(rect.height, element.scrollHeight);

		return x >= rect.left && x <= rect.left + width && y >= rect.top && y <= rect.top + height;
	}

	get keyboardControlsActive() {
		return this.#keyboardController.active;
	}

	set keyboardControlsActive(value: boolean) {
		this.#keyboardController.active = value;
	}

	get position() {
		return this.#position$();
	}

	/**
	 * Cleanup method to be called when the pointer service is destroyed
	 */
	destroy() {
		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}
}

let pointerService: PointerService | undefined = undefined;

export function getPointerService() {
	// Define pointer service at time of calling, so that effect context is assured.
	if (!pointerService) {
		pointerService = new PointerService();
	}

	return pointerService;
}

/**
 * A service scoped to a FlexiBoard that manages auto-scrolling of the board itself,
 * as well as any ancestors to it. Scrolls containers in hierarchical order: target first,
 * then its parent, then grandparent, etc.
 */
export class AutoScrollService {
	// Shared with the owning board controller: signals are stable references,
	// so we track the board's ref signal directly rather than copying it.
	#ref$: Signal<HTMLElement | undefined>;
	#pointerService: PointerService = getPointerService();
	#scrollableContainers$: Signal<HTMLElement[]> = signal([]);
	#animationFrameId: number | null = null;
	#isScrolling: boolean = false;

	shouldAutoScroll$: Signal<boolean> = signal(false);

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];
	#stopEffects: (() => void)[] = [];

	/** Board-level opt-out (FlexiBoardConfiguration.autoScroll); read per action so config changes apply live. */
	#enabled: () => boolean;

	constructor(ref: Signal<HTMLElement | undefined>, enabled: () => boolean = () => true) {
		this.#eventBus = getFlexiEventBus();
		this.#ref$ = ref;
		this.#enabled = enabled;

		// Update scrollable containers when ref changes
		this.#stopEffects.push(
			effect(() => {
				if (this.ref) {
					this.#updateScrollableContainers();
				}
			})
		);

		this.#unsubscribers.push(
			this.#eventBus.subscribe('widget:grabbed', this.startAutoScroll.bind(this)),
			this.#eventBus.subscribe('widget:resizing', this.startAutoScroll.bind(this)),
			this.#eventBus.subscribe('widget:release', this.stopAutoScroll.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.stopAutoScroll.bind(this)),
			this.#eventBus.subscribe('pointer:moved', (event) => {
				this.#checkScrollConditions(event.x, event.y);
			})
		);
	}

	startAutoScroll(event: InternalWidgetEvent) {
		if (!this.#enabled()) {
			return;
		}
		this.shouldAutoScroll$(true);
	}

	stopAutoScroll(event: InternalWidgetEvent) {
		this.shouldAutoScroll$(false);
	}

	#updateScrollableContainers() {
		// No need to manually trigger reactivity as they're direct assignments.
		if (!this.ref) {
			this.#scrollableContainers$([]);
			return;
		}

		// Start with the target element itself, then add ancestors
		const containers = [this.ref];
		containers.push(...this.#getScrollableAncestors(this.ref));
		this.#scrollableContainers$(containers);
	}

	#getScrollableAncestors(element: HTMLElement): HTMLElement[] {
		const ancestors: HTMLElement[] = [];
		let parent = element.parentElement;

		while (parent) {
			const isScrollable = this.#isElementScrollable(parent);

			if (isScrollable) {
				ancestors.push(parent);
			}
			parent = parent.parentElement;
		}
		return ancestors;
	}

	#isPageLevel(element: HTMLElement): boolean {
		return element.tagName === 'HTML' || element.tagName === 'BODY';
	}

	#isElementScrollable(element: HTMLElement): boolean {
		if (this.#isPageLevel(element)) {
			// Page-level elements can be scrollable without explicit overflow styles
			return (
				element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth
			);
		}

		const style = window.getComputedStyle(element);
		const { overflowY, overflowX } = style;

		const canScrollY =
			(overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'visible') &&
			element.scrollHeight > element.clientHeight;
		const canScrollX =
			(overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'visible') &&
			element.scrollWidth > element.clientWidth;

		return canScrollY || canScrollX;
	}

	#checkScrollConditions(clientX: number, clientY: number) {
		const scrollableContainers = this.#scrollableContainers$();
		if (!this.ref || !this.shouldAutoScroll$() || scrollableContainers.length === 0) {
			this.#stopContinuousScroll();
			return;
		}

		// NEXT: Provide a configuration option for the scroll threshold and speed.
		// Not done in v0.2 as it's likely this system is going to be rewritten in v0.3.
		const scrollThreshold = 48;

		// Check if we should be scrolling any container
		let shouldScroll = false;
		for (const container of scrollableContainers) {
			if (this.#shouldScrollContainer(container, clientX, clientY, scrollThreshold)) {
				shouldScroll = true;
				break;
			}
		}

		if (shouldScroll && !this.#isScrolling) {
			this.#startContinuousScroll();
		} else if (!shouldScroll && this.#isScrolling) {
			this.#stopContinuousScroll();
		}
	}

	#startContinuousScroll() {
		if (this.#isScrolling) {
			return;
		}

		this.#isScrolling = true;
		this.#continuousScrollLoop();
	}

	#stopContinuousScroll() {
		if (this.#animationFrameId !== null) {
			cancelAnimationFrame(this.#animationFrameId);
			this.#animationFrameId = null;
		}
		this.#isScrolling = false;
	}

	#continuousScrollLoop() {
		if (!this.#isScrolling) {
			return;
		}

		const { x, y } = this.#pointerService.position;
		this.#performAutoScroll(x, y);

		this.#animationFrameId = requestAnimationFrame(() => {
			this.#continuousScrollLoop();
		});
	}

	#performAutoScroll(clientX: number, clientY: number) {
		const scrollableContainers = this.#scrollableContainers$();
		if (!this.ref || !this.shouldAutoScroll$() || scrollableContainers.length === 0) {
			return;
		}

		const scrollThreshold = 48;
		const scrollSpeed = 4;

		// Try scrolling containers in hierarchical order (target first, then ancestors)
		for (const container of scrollableContainers) {
			const scrollResult = this.#tryScrollContainer(
				container,
				clientX,
				clientY,
				scrollThreshold,
				scrollSpeed
			);

			// If we successfully scrolled this container, stop here to maintain hierarchy
			if (scrollResult.didScroll) {
				break;
			}
		}
	}

	#shouldScrollContainer(
		container: HTMLElement,
		clientX: number,
		clientY: number,
		scrollThreshold: number
	): boolean {
		const rect = container.getBoundingClientRect();
		const effectiveRect = this.#getEffectiveRect(container, rect);

		// Check if pointer is within this container's effective bounds
		const isWithinBounds =
			clientX >= effectiveRect.left &&
			clientX <= effectiveRect.right &&
			clientY >= effectiveRect.top &&
			clientY <= effectiveRect.bottom;

		if (!isWithinBounds) {
			return false;
		}

		const scrollInfo = this.#getScrollInfo(container);

		// Check if we're in a scroll zone and can actually scroll
		const inVerticalScrollZone =
			(clientY > effectiveRect.bottom - scrollThreshold && scrollInfo.canScrollDown) ||
			(clientY < effectiveRect.top + scrollThreshold && scrollInfo.canScrollUp);

		const inHorizontalScrollZone =
			(clientX > effectiveRect.right - scrollThreshold && scrollInfo.canScrollRight) ||
			(clientX < effectiveRect.left + scrollThreshold && scrollInfo.canScrollLeft);

		return (
			(container.scrollHeight > container.clientHeight && inVerticalScrollZone) ||
			(container.scrollWidth > container.clientWidth && inHorizontalScrollZone)
		);
	}

	#tryScrollContainer(
		container: HTMLElement,
		clientX: number,
		clientY: number,
		scrollThreshold: number,
		scrollSpeed: number
	): { didScroll: boolean } {
		const rect = container.getBoundingClientRect();
		let didScroll = false;

		// For HTML/BODY elements, clamp the boundaries to the viewport
		const effectiveRect = this.#getEffectiveRect(container, rect);

		// TODO: tweak so the pointer can be outside bounds, but within an abs threshold
		// of the edge of the container.

		// Check if pointer is within this container's effective bounds
		const isWithinBounds =
			clientX >= effectiveRect.left &&
			clientX <= effectiveRect.right &&
			clientY >= effectiveRect.top &&
			clientY <= effectiveRect.bottom;

		if (!isWithinBounds) {
			return { didScroll: false };
		}

		const scrollInfo = this.#getScrollInfo(container);

		// Check vertical scrolling conditions
		if (container.scrollHeight > container.clientHeight) {
			if (clientY > effectiveRect.bottom - scrollThreshold && scrollInfo.canScrollDown) {
				this.#scrollElement(container, 0, scrollSpeed);
				didScroll = true;
			} else if (clientY < effectiveRect.top + scrollThreshold && scrollInfo.canScrollUp) {
				this.#scrollElement(container, 0, -scrollSpeed);
				didScroll = true;
			}
		}

		// Check horizontal scrolling conditions
		if (container.scrollWidth > container.clientWidth) {
			if (clientX > effectiveRect.right - scrollThreshold && scrollInfo.canScrollRight) {
				this.#scrollElement(container, scrollSpeed, 0);
				didScroll = true;
			} else if (clientX < effectiveRect.left + scrollThreshold && scrollInfo.canScrollLeft) {
				this.#scrollElement(container, -scrollSpeed, 0);
				didScroll = true;
			}
		}

		return { didScroll };
	}

	#getEffectiveRect(container: HTMLElement, rect: DOMRect) {
		if (this.#isPageLevel(container)) {
			// Clamp page-level boundaries to viewport
			return {
				left: Math.max(0, rect.left),
				right: Math.min(window.innerWidth, rect.right),
				top: Math.max(0, rect.top),
				bottom: Math.min(window.innerHeight, rect.bottom)
			};
		}

		// Use actual boundaries for regular containers
		return rect;
	}

	#getScrollInfo(element: HTMLElement) {
		if (this.#isPageLevel(element)) {
			// Use window/document properties for page-level scrolling
			const scrollTop = window.scrollY;
			const scrollLeft = window.scrollX;
			const scrollHeight = document.documentElement.scrollHeight;
			const scrollWidth = document.documentElement.scrollWidth;
			const clientHeight = window.innerHeight;
			const clientWidth = window.innerWidth;

			return {
				canScrollDown: scrollTop + clientHeight < scrollHeight,
				canScrollUp: scrollTop > 0,
				canScrollRight: scrollLeft + clientWidth < scrollWidth,
				canScrollLeft: scrollLeft > 0
			};
		}

		// Use element properties for regular containers
		const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = element;

		return {
			canScrollDown: scrollTop + clientHeight < scrollHeight,
			canScrollUp: scrollTop > 0,
			canScrollRight: scrollLeft + clientWidth < scrollWidth,
			canScrollLeft: scrollLeft > 0
		};
	}

	#scrollElement(element: HTMLElement, deltaX: number, deltaY: number) {
		if (this.#isPageLevel(element)) {
			window.scrollBy(deltaX, deltaY);
		} else {
			element.scrollBy(deltaX, deltaY);
		}
	}

	get ref() {
		return this.#ref$();
	}

	/**
	 * Manually stop continuous scrolling. Useful for external control.
	 */
	stopScrolling() {
		this.#stopContinuousScroll();
	}

	/**
	 * Cleanup method, called by the owning board controller's destroy().
	 * Replaces the Svelte component-teardown effect from the original.
	 */
	destroy() {
		this.#stopContinuousScroll();
		this.#stopEffects.forEach((stop) => stop());
		this.#stopEffects = [];
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}
}

export class KeyboardPointerController {
	active = false;
	#moveStep: number = 20;
	#pointerService: PointerService;

	constructor(pointerService: PointerService) {
		this.#pointerService = pointerService;

		if (typeof window === 'undefined') {
			return;
		}

		const cancelFocusChangeIfTrapped = this.#cancelFocusChangeIfTrapped.bind(this);
		const movePointer = this.#movePointer.bind(this);

		window.addEventListener('keydown', cancelFocusChangeIfTrapped);
		window.addEventListener('keydown', movePointer);
	}

	#cancelFocusChangeIfTrapped(event: KeyboardEvent) {
		if (!this.active) {
			return;
		}

		if (event.key === 'Tab') {
			event.preventDefault();
		}
	}

	#movePointer(event: KeyboardEvent) {
		if (!this.active) {
			return;
		}

		const moveStep = this.#getMoveStep(event);

		const { x, y } = this.#pointerService.position;

		if (event.key === 'ArrowUp') {
			this.#pointerService.updatePosition(x, y - moveStep);
			event.preventDefault();
			return;
		}

		if (event.key === 'ArrowDown') {
			this.#pointerService.updatePosition(x, y + moveStep);
			event.preventDefault();
			return;
		}

		if (event.key === 'ArrowLeft') {
			this.#pointerService.updatePosition(x - moveStep, y);
			event.preventDefault();
			return;
		}

		if (event.key === 'ArrowRight') {
			this.#pointerService.updatePosition(x + moveStep, y);
			event.preventDefault();
			return;
		}
	}

	#getMoveStep(event: KeyboardEvent) {
		if (event.shiftKey) {
			return this.#moveStep * 10;
		}

		if (event.ctrlKey || event.metaKey) {
			return this.#moveStep * 0.1;
		}

		return this.#moveStep;
	}
}

type CellPosition = {
	row: number;
	column: number;
};

type GridDimensions = {
	left: number;
	width: number;
	columns: number[];
	columnString: string;
	columnGap: number;

	top: number;
	height: number;
	rows: number[];
	rowString: string;
	rowGap: number;
};

type ScrollListener = { element: EventTarget; handler: () => void };

export class GridDimensionTracker {
	#dimensions$: Signal<GridDimensions> = signal({
		left: 0,
		width: 0,
		columns: [],
		columnString: '',
		columnGap: 0,

		top: 0,
		height: 0,
		rows: [],
		rowString: '',
		rowGap: 0
	});

	#grid$: Signal<FlexiGrid | null> = signal(null);

	// Plain field: nothing tracks the pointer position reactively.
	#pointerPosition = {
		x: 0,
		y: 0
	};

	#targetConfig$: Signal<FlexiTargetConfiguration> = signal({} as FlexiTargetConfiguration);

	#activeScrollListeners: { element: EventTarget; handler: () => void }[] = [];
	#currentScrollableAncestors: HTMLElement[] = [];

	constructor(grid: FlexiGrid, targetConfig: FlexiTargetConfiguration) {
		this.#grid$(grid);
		this.#targetConfig$(targetConfig);
	}

	/**
	 * Starts watching the grid for dimension changes. Call at mount time
	 * (the adapter's responsibility) and invoke the returned cleanup at unmount.
	 */
	watchGrid(): () => void {
		// Whenever a change occurs to the grid's dimensions or the underlying widgets, update the sizes.
		// Unlike Svelte's deep $state tracking, dependencies are explicit here: we
		// track the grid reference and its row/column counts, then update untracked.
		const stopEffect = effect(() => {
			const grid = this.#grid$();

			if (!grid) {
				return;
			}

			// Explicit dependencies: re-run when the grid's structure changes.
			grid.rows;
			grid.columns;

			// There's a weird edge case where adjusting dimensions causes an infinite effect when the grid is destroyed - but even without
			// knowing the exact cause, it's sensible to untrack this regardless.
			untracked(() => {
				this.updateGridDimensions();
			});
		});

		// Whenever the grid is resized, update the sizes.
		this.setupScrollListeners();

		const grid = this.#grid$();
		let observer: ResizeObserver | null = null;

		if (grid?.ref) {
			observer = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (!entry) {
					return;
				}

				this.updateGridDimensions();
			});

			observer.observe(grid.ref);
		}

		return () => {
			stopEffect();
			observer?.disconnect();
			this.#cleanupScrollListeners();
		};
	}

	updateGridDimensions() {
		const grid = this.#grid$();
		const gridElement = grid?.ref;

		if (!gridElement || !window) {
			return;
		}

		const rect = gridElement.getBoundingClientRect();
		const style = window.getComputedStyle(gridElement);

		// Computed style gives us pixel values for each column and row of the grid.
		const templateColumns = style.getPropertyValue('grid-template-columns');
		const templateRows = style.getPropertyValue('grid-template-rows');
		const gapX = style.getPropertyValue('grid-column-gap');
		const gapY = style.getPropertyValue('grid-row-gap');

		// If the dimensions are unchanged, we don't need to update them.
		const dimensions = this.#dimensions$();

		if (
			templateColumns == dimensions.columnString &&
			templateRows == dimensions.rowString &&
			dimensions.left == rect.left &&
			dimensions.top == rect.top &&
			dimensions.width == rect.width &&
			dimensions.height == rect.height &&
			grid.rows == dimensions.rows.length &&
			grid.columns == dimensions.columns.length
		) {
			return;
		}

		const columns = templateColumns
			.split(' ')
			.map((column) => parseFloat(column.match(/(\d+\.?\d*)px/)?.[1] ?? '0'));
		const rows = templateRows
			.split(' ')
			.map((row) => parseFloat(row.match(/(\d+\.?\d*)px/)?.[1] ?? '0'));

		// Update in-place, manually trigger the reactive response.
		dimensions.left = rect.left;
		dimensions.width = rect.width;
		dimensions.columns = columns;
		dimensions.top = rect.top;
		dimensions.height = rect.height;
		dimensions.rows = rows;
		dimensions.columnGap = parseFloat(gapX.match(/(\d+\.?\d*)px/)?.[1] ?? '0');
		dimensions.rowGap = parseFloat(gapY.match(/(\d+\.?\d*)px/)?.[1] ?? '0');
		dimensions.columnString = templateColumns;
		dimensions.rowString = templateRows;

		trigger(() => this.#dimensions$());
	}

	#cleanupScrollListeners() {
		this.#activeScrollListeners.forEach(({ element, handler }) => {
			element.removeEventListener('scroll', handler);
		});
		this.#activeScrollListeners = [];
		this.#currentScrollableAncestors = [];
	}

	#updatePositionOnScroll() {
		const grid = this.#grid$();

		if (!grid?.ref) {
			return;
		}
		const rect = grid.ref.getBoundingClientRect();

		// Update in-place, then re-trigger reactivity.
		const dimensions = this.#dimensions$();
		dimensions.left = rect.left;
		dimensions.top = rect.top;
		dimensions.width = rect.width;
		dimensions.height = rect.height;
		trigger(() => this.#dimensions$());
	}

	#attachScrollListeners(elements: EventTarget[]): ScrollListener[] {
		const listeners: ScrollListener[] = [];
		const handler = () => this.#updatePositionOnScroll();

		elements.forEach((element) => {
			element.addEventListener('scroll', handler, { passive: true });
			listeners.push({ element, handler });
		});
		return listeners;
	}

	setupScrollListeners() {
		const gridElement = this.#grid$()?.ref;
		if (!gridElement || !window) {
			return;
		}

		this.#cleanupScrollListeners(); // Clean up any existing listeners first

		this.#currentScrollableAncestors = this.#getScrollableAncestors(gridElement);
		const listenersToAttach = [window, ...this.#currentScrollableAncestors];
		this.#activeScrollListeners = this.#attachScrollListeners(listenersToAttach);

		this.#updatePositionOnScroll(); // Initial update
	}

	refreshScrollListeners() {
		const gridElement = this.#grid$()?.ref;
		if (!gridElement || !window) {
			return;
		}

		const newAncestors = this.#getScrollableAncestors(gridElement);

		const ancestorsChanged =
			newAncestors.length !== this.#currentScrollableAncestors.length ||
			newAncestors.some((ancestor, index) => ancestor !== this.#currentScrollableAncestors[index]);

		if (ancestorsChanged) {
			this.#cleanupScrollListeners();
			this.#currentScrollableAncestors = newAncestors;
			const listenersToAttach = [window, ...this.#currentScrollableAncestors];
			this.#activeScrollListeners = this.#attachScrollListeners(listenersToAttach);
			this.#updatePositionOnScroll(); // Update dimensions after listeners are set
		}
	}

	#getScrollableAncestors(element: HTMLElement | undefined): HTMLElement[] {
		const ancestors: HTMLElement[] = [];
		if (!element) {
			return ancestors;
		}

		// Get all ancestors of the element that are scrollable.
		let parent = element.parentElement;
		while (parent) {
			const style = window.getComputedStyle(parent);
			const overflowY = style.getPropertyValue('overflow-y');
			const overflowX = style.getPropertyValue('overflow-x');
			const isScrollable =
				((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') &&
					parent.scrollHeight > parent.clientHeight) ||
				((overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') &&
					parent.scrollWidth > parent.clientWidth);

			if (isScrollable) {
				ancestors.push(parent);
			}
			parent = parent.parentElement;
		}
		return ancestors;
	}

	getCellFromPointerPosition(clientX: number, clientY: number): CellPosition | null {
		const grid = this.#grid$();
		if (!grid?.ref) {
			return null;
		}

		this.#pointerPosition.x = clientX;
		this.#pointerPosition.y = clientY;

		// Reordering widgets of unequal size swaps row/column track sizes without changing the
		// grid's own size or track count, so neither the ResizeObserver nor the rows/columns effect
		// fires. Remeasure here (a no-op when nothing changed) so the mapping never uses stale tracks.
		this.updateGridDimensions();

		const dimensions = this.#dimensions$();

		let xCell = findCell(
			clientX,
			dimensions.left,
			contentSize(dimensions.columns, dimensions.columnGap),
			dimensions.columnGap,
			dimensions.columns
		);
		let yCell = findCell(
			clientY,
			dimensions.top,
			contentSize(dimensions.rows, dimensions.rowGap),
			dimensions.rowGap,
			dimensions.rows
		);

		return {
			row: yCell,
			column: xCell
		};
	}
}

export function contentSize(axisCoordinates: number[], gap: number) {
	const totalCells = axisCoordinates.reduce((sum, size) => sum + size, 0);
	const totalGaps = Math.max(0, axisCoordinates.length - 1) * gap;
	return totalCells + totalGaps;
}

export function findCell(
	pointerLocation: number,
	start: number,
	size: number,
	gap: number,
	axisCoordinates: number[]
) {
	// If outside the axis, then return the ends.
	if (pointerLocation < start) {
		return 0;
	}
	if (pointerLocation >= start + size) {
		return axisCoordinates.length;
	}

	let subtotal = start - gap / 2;
	for (let i = 0; i < axisCoordinates.length; i++) {
		const base = subtotal;
		subtotal += axisCoordinates[i] + gap;

		const proportionAlong = (pointerLocation - base) / (subtotal - base);
		if (pointerLocation < subtotal) {
			return i + proportionAlong;
		}
	}
	return axisCoordinates.length;
}

let uniqueIdIndex = 0;
export function generateUniqueId(prefix: string = 'flexi-') {
	return prefix + uniqueIdIndex++;
}

/* Adapted from TailwindCSS sr-only */
export const assistiveTextStyle = `
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
`;

/* Adapted from TailwindCSS sr-only - JS object equivalent. */
export const assistiveTextStyleObject = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: '0',
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	whiteSpace: 'nowrap',
	borderWidth: '0'
} as const;

/**
 * Reads an element's border box as laid out, ignoring any CSS transform set on
 * the element itself (`transform`, `rotate`, `scale`, `translate`).
 *
 * `getBoundingClientRect()` includes transforms, so a decorative grab tilt or
 * scale on a widget would otherwise corrupt offset and size calculations. When
 * any such property is present, the transforms are neutralised inline, the rect
 * read, and the inline styles restored — all synchronously before the next
 * paint, so nothing flashes on screen. Costs one forced reflow, and only when a
 * transform exists; untransformed elements take the fast path.
 */
export function getLayoutRect(element: HTMLElement): DOMRect {
	// Resolve getComputedStyle from the element's own realm (the widget may live
	// inside an iframe); fall back to gBCR where no window exists (tests).
	const view = element.ownerDocument?.defaultView;
	if (!view?.getComputedStyle) {
		return element.getBoundingClientRect();
	}

	const computed = view.getComputedStyle(element);
	const hasTransform =
		computed.transform !== 'none' ||
		computed.rotate !== 'none' ||
		computed.scale !== 'none' ||
		computed.translate !== 'none';

	if (!hasTransform) {
		return element.getBoundingClientRect();
	}

	// `!important` inline declarations outrank running CSS animations (plain
	// inline styles do not), so a mid-animation scale/rotate can't leak into the
	// measurement. `transition: none` is forced too, so neither the override nor
	// its restore can start a transition. The animation's clock keeps running —
	// nothing paints between these writes and the restore.
	const inline = element.style;
	const properties = ['transition', 'transform', 'rotate', 'scale', 'translate'] as const;
	const previous = properties.map((property) => ({
		property,
		value: inline.getPropertyValue(property),
		priority: inline.getPropertyPriority(property)
	}));

	for (const property of properties) {
		inline.setProperty(property, 'none', 'important');
	}

	const rect = element.getBoundingClientRect();

	for (const { property, value, priority } of previous) {
		if (value) {
			inline.setProperty(property, value, priority);
		} else {
			inline.removeProperty(property);
		}
	}

	return rect;
}

export function getElementMidpoint(element: HTMLElement) {
	const rect = element.getBoundingClientRect();
	return {
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2
	};
}

export function isGrabPointerEvent(event: PointerEvent) {
	if (event.pointerType !== 'mouse') {
		return true;
	}

	// 0 = left click
	return event.button === 0;
}
