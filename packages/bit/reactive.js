import { Signal } from '../vendor/signal-polyfill.js';

/**
 * @template T
 * @typedef {[() => T, (value: T) => void]} Signal
 * A reactive state tuple of [getter, setter]
 */

/**
 * Symbol used to identify reactive signal getters.
 * Attached to getter functions returned by `signal` and `computed`
 * so the renderer can distinguish them from plain functions and wrap
 * them in effects for fine-grained DOM updates.
 *
 * @internal
 */
export const SIGNAL = symbol('bit.signal');

/**
 * Creates a reactive state signal.
 *
 * @template T
 * @param {T} value - Initial value
 * @returns Signal
 *
 * @example
 * const [count, setCount] = signal(0);
 * count();		// 0
 * setCount(1);
 * count();		// 1
 */
export function signal(value) {
	const s = new Signal.State(value);
	const get = () => s.get();
	const set = (val) => s.set(val);
	get[SIGNAL] = true;
	return [
		get,
		set
	];
}

/**
 * Creates a derived value that recomputes when its signal dependencies change.
 *
 * @template T
 * @param {() => T} fn - Function that reads signals and returns a derived value
 * @returns {() => T} Getter for the computed value
 *
 * @example
 * const [count] = signal(2);
 * const double = computed(() => count() * 2);
 * double(); // 4
 */
export function computed(fn) {
	const c = new Signal.Computed(fn);
	const get = () => c.get();
	get[SIGNAL] = true;
	return get;
}

/**
 * Runs a side effect whenever its signal dependencies change.
 * Executes immediately, then re-runs asynchronously (via microtask) on change.
 *
 * @param {() => void} fn - Effect function that reads signals
 * @returns {() => void} Cleanup function that stops the effect
 *
 * @example
 * const [count, setCount] = signal(0);
 * const stop = effect(() => console.log(count()));
 * setCount(1);	// logs 1 on next microtask
 * stop();		// unsubscribes
 */
export function effect(fn) {
	let cleanup;
	const computed = new Signal.Computed(() => {
		if (typeof cleanup === 'function') cleanup();
		cleanup = fn();
	});
	let pending = false;

	const watcher = new Signal.subtle.Watcher(() => {
		if (!pending) {
			pending = true;
			queueMicrotask(() => {
				pending = false;
				watcher.watch();
				computed.get();
			});
		}
	});

	watcher.watch(computed);
	computed.get();

	return () => {
		watcher.unwatch(computed);
		if (typeof cleanup === 'function') cleanup();
		cleanup = undefined;
	};
}

/**
 * @template T
 * @typedef {(() => T) | Array<() => T>} WatchSource
 * A signal getter or array of signal getters.
 */

/**
 * @template T
 * @typedef {(newValue: T, oldValue: T) => void} WatchCallback
 * Called when a watched signal changes, receiving the new and previous values.
 */

/**
 * Watches one or more signals and calls a callback when their values change.
 * Unlike `effect`, skips the initial run and only fires on subsequent changes.
 *
 * @template T
 * @param {WatchSource} source - A signal getter or array of getters to watch
 * @param {WatchCallback<T> | WatchCallback<T[]>} callback - Called with new and previous values
 * @returns {() => void} Cleanup function that stops the watcher
 *
 * @example
 * const [count, setCount] = signal(0);
 * const stop = watch(count, (newVal, oldVal) => console.log(newVal, oldVal));
 * setCount(1); // logs 1, 0
 * stop();
 */
export function watch(source, callback) {
	const getter = Array.isArray(source) ? () => source.map((s) => s()) : source;

	let oldValue = getter();
	let isFirst = true;

	return effect(() => {
		const newValue = getter();
		if (isFirst) {
			isFirst = false;
			return;
		}
		callback(newValue, oldValue);
		oldValue = newValue;
	});
}
