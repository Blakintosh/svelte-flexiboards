import { MockResizeObserver } from './helpers.js';

// React's act() warns unless the environment opts in.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
