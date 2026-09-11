import type { ResponsiveFlexiBoardController } from './base.js';
import { InternalResponsiveFlexiBoardController } from './controller.js';
import type {
	ResponsiveFlexiBoardConfiguration,
	ResponsiveFlexiBoardProps,
	ResponsiveFlexiLayout
} from './types.js';

export { InternalResponsiveFlexiBoardController };
export * from './types.js';

/* Exports to go to root index.ts */
export {
	type ResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardConfiguration,
	type ResponsiveFlexiBoardProps,
	type ResponsiveFlexiLayout
};
