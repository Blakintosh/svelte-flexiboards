import { getInternalFlexiboardCtx } from './board/index.js';
import { getFlexiEventBus, type FlexiEventBus } from './shared/event-bus.js';
import type { WidgetGrabbedEvent, WidgetEvent, WidgetResizingEvent } from './types.js';
import type { FlexiWidgetController } from './widget/index.js';

/**
 * GrabbedPortal manages a single container in the DOM where grabbed/resizing
 * widgets can be rendered on top of the application.
 */
export class FlexiPortalController {
	#containerElement: HTMLElement | null = null;
	#widgetRefs = new Map<
		FlexiWidgetController,
		{
			originalParent: Node;
			nextSibling: Node | null;
		}
	>();

	#dependencyCount = 0;
	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

	constructor() {
		this.#eventBus = getFlexiEventBus();
	}

	createPortal() {
		// Create container element
		this.#containerElement = document.createElement('div');
		this.#containerElement.id = 'flexi-portal';
		this.#containerElement.style.position = 'fixed';
		this.#containerElement.style.top = '0';
		this.#containerElement.style.left = '0';
		this.#containerElement.style.width = '100%';
		this.#containerElement.style.height = '100%';
		this.#containerElement.style.pointerEvents = 'none';
		this.#containerElement.style.zIndex = '9999';

		// Append to body
		document.body.appendChild(this.#containerElement);

		this.#unsubscribers.push(
			this.#eventBus.subscribe('widget:grabbed', this.onWidgetGrabbed.bind(this)),
			this.#eventBus.subscribe('widget:resizing', this.onWidgetResizing.bind(this)),
			this.#eventBus.subscribe('widget:release', this.onWidgetRelease.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.onWidgetRelease.bind(this))
		);
	}

	onWidgetGrabbed(event: WidgetGrabbedEvent) {
		this.moveWidgetToPortal(event.widget);
	}

	onWidgetResizing(event: WidgetResizingEvent) {
		this.moveWidgetToPortal(event.widget);
	}

	onWidgetRelease(event: WidgetEvent) {
		this.returnWidgetFromPortal(event.widget);
	}

	/**
	 * Moves a widget's DOM element to the portal container
	 */
	moveWidgetToPortal(widget: FlexiWidgetController) {
		if (!widget.ref) {
			console.warn(
				'moveWidgetToPortal() was called on a widget that has no ref. No widget will appear under the pointer.'
			);
			return;
		}

		// Store original position info
		this.#widgetRefs.set(widget, {
			originalParent: widget.ref.parentNode!,
			nextSibling: widget.ref.nextSibling
		});

		// Move to portal
		this.#containerElement!.appendChild(widget.ref);
	}

	/**
	 * Returns a widget's DOM element to its original position
	 */
	returnWidgetFromPortal(widget: FlexiWidgetController) {
		if (!widget.ref) {
			return;
		}

		const originalPosition = this.#widgetRefs.get(widget);
		if (originalPosition) {
			originalPosition.originalParent.insertBefore(widget.ref, originalPosition.nextSibling);
			this.#widgetRefs.delete(widget);
		}
	}

	/**
	 * Destroys the portal container and resets the singleton instance
	 */
	destroy() {
		// Clean up event subscriptions
		this.#unsubscribers.forEach(unsubscribe => unsubscribe());
		this.#unsubscribers = [];

		// First return any widgets still in the portal
		this.#widgetRefs.forEach((position, widget) => {
			if (widget.ref) {
				position.originalParent.insertBefore(widget.ref, position.nextSibling);
			}
		});
		this.#widgetRefs.clear();

		if (this.#containerElement && this.#containerElement.parentNode) {
			this.#containerElement.parentNode.removeChild(this.#containerElement);
		}

		this.#containerElement = null;
	}

	addDependency() {
		this.#dependencyCount++;

		if (!this.#containerElement) {
			this.createPortal();
		}
	}

	removeDependency() {
		this.#dependencyCount--;
		if (this.#dependencyCount === 0 && this.#containerElement) {
			this.destroy();
			portal = null;
		}
	}
}

let portal: FlexiPortalController | null = null;

export function flexiportal() {
	const board = getInternalFlexiboardCtx();

	if (!board) {
		throw new Error('flexiportal() was called outside of a FlexiBoard context.');
	}

	// We use a singleton instance of the portal, avoiding duplication in the DOM.
	if (!portal) {
		portal = new FlexiPortalController();
	}

	board.portal = portal;
	portal.addDependency();

	return portal;
}

export function destroyFlexiportal() {
	// Stop tracking this dependency, destroying the portal if no other boards are depending on it.
	if (portal) {
		portal.removeDependency();
	}
}
