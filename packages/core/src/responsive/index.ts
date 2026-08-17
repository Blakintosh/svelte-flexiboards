import type { ResponsiveFlexiBoardController } from './base.js';
import { InternalResponsiveFlexiBoardController } from './controller.js';
import type {
	ResponsiveFlexiBoardConfiguration,
	ResponsiveFlexiBoardProps,
	ResponsiveFlexiLayout
} from './types.js';

// TODO(adapter): removed responsiveflexiboard(props) — composition root that constructed the
// InternalResponsiveFlexiBoardController and set the responsive board context. Adapters must construct the
// controller, provide it via their own context mechanism, and call controller.destroy() at unmount.
// TODO(adapter): removed getInternalResponsiveFlexiboardCtx() — context getter returning the internal
// responsive controller (child boards now receive it via the InternalFlexiBoardController constructor).
// TODO(adapter): removed hasInternalResponsiveFlexiboardCtx() — context presence check used by child boards
// to detect a responsive parent.
// TODO(adapter): removed getResponsiveFlexiboardCtx() — context getter narrowing to the public
// ResponsiveFlexiBoardController.

export { InternalResponsiveFlexiBoardController };
export * from './types.js';

/* Exports to go to root index.ts */
export {
	type ResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardConfiguration,
	type ResponsiveFlexiBoardProps,
	type ResponsiveFlexiLayout
};
