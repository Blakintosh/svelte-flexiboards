import type { FlexiBoardController } from './base.js';
import { InternalFlexiBoardController } from './controller.js';
import type { FlexiBoardConfiguration, FlexiBoardProps } from './types.js';
import { boardEvents } from './events.js';

export { InternalFlexiBoardController, boardEvents };
export * from './types.js';

/* Exports to go to root index.ts */
export { type FlexiBoardController, type FlexiBoardConfiguration, type FlexiBoardProps };
