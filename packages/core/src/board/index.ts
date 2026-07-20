import type { FlexiBoardController } from './base.js';
import { InternalFlexiBoardController } from './controller.js';
import type { FlexiBoardConfiguration, FlexiBoardProps } from './types.js';
import { boardEvents } from './events.js';

// TODO(adapter): removed flexiboard(props) — composition root that created the InternalFlexiBoardController,
// set the board context, and wired boardEvents(board). Adapters must construct the controller, provide it via
// their own context mechanism, call boardEvents(board) at mount, and call board.destroy() at unmount.
// TODO(adapter): removed getInternalFlexiboardCtx() — context getter returning the internal board controller.
// TODO(adapter): removed getFlexiboardCtx() — context getter narrowing to the public FlexiBoardController.

export { InternalFlexiBoardController, boardEvents };

/* Exports to go to root index.ts */
export { type FlexiBoardController, type FlexiBoardConfiguration, type FlexiBoardProps };
