// Reactivity façade — adapters bridge framework reactivity from effect()/signal().
export * from './reactivity.js';

// Shared public types.
export * from './types.js';

// Systems.
export * from './board/index.js';
export * from './target/index.js';
export * from './widget/index.js';
export * from './grid/index.js';
export * from './responsive/index.js';

// Adder / deleter.
export * from './misc/adder.js';
export * from './misc/deleter.js';

// Announcer + portal.
export * from './announcer.js';
export * from './portal.js';

// Shared infrastructure used by adapter composition roots.
export * from './shared/event-bus.js';
export * from './shared/reactive-collections.js';
export * from './shared/utils.js';
