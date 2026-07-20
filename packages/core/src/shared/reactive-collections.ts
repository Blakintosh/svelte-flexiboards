/**
 * Signal-backed Set and Map, replacing svelte/reactivity's SvelteSet and
 * SvelteMap. Coarse-grained: any mutation notifies all readers of the
 * collection, which matches how Flexiboards used the Svelte versions.
 */
import { signal, trigger, type Signal } from '../reactivity.js';

export class ReactiveSet<T> implements Iterable<T> {
	#set$: Signal<Set<T>>;

	constructor(values?: Iterable<T> | null) {
		this.#set$ = signal(new Set(values ?? undefined));
	}

	#notify() {
		trigger(this.#set$);
	}

	add(value: T): this {
		const set = this.#set$();
		if (!set.has(value)) {
			set.add(value);
			this.#notify();
		}
		return this;
	}

	delete(value: T): boolean {
		const deleted = this.#set$().delete(value);
		if (deleted) {
			this.#notify();
		}
		return deleted;
	}

	clear(): void {
		const set = this.#set$();
		if (set.size > 0) {
			set.clear();
			this.#notify();
		}
	}

	has(value: T): boolean {
		return this.#set$().has(value);
	}

	get size(): number {
		return this.#set$().size;
	}

	forEach(callback: (value: T, value2: T, set: Set<T>) => void): void {
		this.#set$().forEach(callback);
	}

	values(): IterableIterator<T> {
		return this.#set$().values();
	}

	keys(): IterableIterator<T> {
		return this.#set$().keys();
	}

	entries(): IterableIterator<[T, T]> {
		return this.#set$().entries();
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.#set$()[Symbol.iterator]();
	}
}

export class ReactiveMap<K, V> implements Iterable<[K, V]> {
	#map$: Signal<Map<K, V>>;

	constructor(entries?: Iterable<readonly [K, V]> | null) {
		this.#map$ = signal(new Map(entries ?? undefined));
	}

	#notify() {
		trigger(this.#map$);
	}

	set(key: K, value: V): this {
		const map = this.#map$();
		if (!map.has(key) || map.get(key) !== value) {
			map.set(key, value);
			this.#notify();
		}
		return this;
	}

	delete(key: K): boolean {
		const deleted = this.#map$().delete(key);
		if (deleted) {
			this.#notify();
		}
		return deleted;
	}

	clear(): void {
		const map = this.#map$();
		if (map.size > 0) {
			map.clear();
			this.#notify();
		}
	}

	get(key: K): V | undefined {
		return this.#map$().get(key);
	}

	has(key: K): boolean {
		return this.#map$().has(key);
	}

	get size(): number {
		return this.#map$().size;
	}

	forEach(callback: (value: V, key: K, map: Map<K, V>) => void): void {
		this.#map$().forEach(callback);
	}

	values(): IterableIterator<V> {
		return this.#map$().values();
	}

	keys(): IterableIterator<K> {
		return this.#map$().keys();
	}

	entries(): IterableIterator<[K, V]> {
		return this.#map$().entries();
	}

	[Symbol.iterator](): IterableIterator<[K, V]> {
		return this.#map$()[Symbol.iterator]();
	}
}
