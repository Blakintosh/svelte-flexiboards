import { act } from 'react';
import { configure, installResizeObserver } from '@flexiboards/testing';

// React's act() warns unless the environment opts in.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

installResizeObserver();
// Every helper dispatch commits inside act(), so the DOM is settled when it returns.
configure({ flush: act });
