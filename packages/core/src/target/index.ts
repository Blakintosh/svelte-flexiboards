import type { FlexiTargetController } from './base.js';
import type { FlexiTargetConfiguration } from './types.js';

// TODO(adapter): removed flexitarget — created a target on the context board provider via provider.createTarget() and set it in component context.
// TODO(adapter): removed getInternalFlexitargetCtx — retrieved the InternalFlexiTargetController from Svelte context, throwing if absent.
// TODO(adapter): removed getFlexitargetCtx — public wrapper returning the context target as FlexiTargetController.

export { InternalFlexiTargetController } from './controller.js';
export * from './types.js';

/* Exports to go to root index.ts */
export { type FlexiTargetConfiguration, type FlexiTargetController };
