import {effect, signal} from "./reactive.js";

/**
 * @typedef {Object} BitConfiguration
 * @property {((template: *, container: Element | ShadowRoot) => void) | null} [renderer=null] - The render function used to mount and update templates.
 */

/**
 * Creates a defineComponent factory bound to a renderer.
 * Omit the renderer for templateless components.
 *
 * @param {BitConfiguration} [config]
 * @returns {DefineComponent}
 *
 * @example
 * import { createBit } from 'bit';
 * import { render } from 'bit/renderer';
 *
 * const defineComponent = createBit({ renderer: render });
 */
export function createBit(config = {}) {
	return (options) => defineComponent(options, config);
}

/**
 * @typedef {Object} AttrOptions
 * @property {*} default - The default value if the attribute is not present. Should be the post-coercion type (e.g. 0 for Number, false for Boolean).
 * @property {Function} [type] - Optional coercion function applied to the raw string value (e.g. Number, Boolean).
 */

/**
 * @typedef {Object.<string, AttrOptions>} AttrsDefinition
 * A map of attribute names to their options.
 *
 * @example
 * attrs: {
 *     label: { default: 'Click me' },
 *     count: { default: '0', type: Number },
 *     disabled: { default: false, type: Boolean }
 * }
 */

/**
 * @typedef {Object} PropOptions
 * @property {*} default - The default value for the prop, used until the property is set.
 */

/**
 * @typedef {Object.<string, PropOptions>} PropsDefinition
 * A map of prop names to their options.
 */

/**
 * Declares an observed attribute with a default value and optional type coercion.
 *
 * @param {*} defaultValue
 * @param {Function} [type] - Optional coercion function (e.g. Number, Boolean).
 * @returns {AttrOptions}
 *
 * @example
 * attrs: {
 *     label: attr('Click me'),
 *     count: attr(0, Number),
 *     disabled: attr(false, Boolean),
 * }
 */
export function attr(defaultValue, type) {
	return { default: defaultValue, type };
}

/**
 * Declares a prop with a default value.
 *
 * @param {*} defaultValue
 * @returns {PropOptions}
 *
 * @example
 * props: {
 *     count: prop(0),
 *     user: prop(null),
 * }
 */
export function prop(defaultValue) {
	return { default: defaultValue };
}

/**
 * @typedef {Object} EmitOptions
 * @property {boolean} [bubbles=true] - Whether the event bubbles up the DOM tree.
 * @property {boolean} [composed=true] - Whether the event crosses the shadow DOM boundary.
 * @property {boolean} [cancelable=false] - Whether the event can be canceled by a listener calling preventDefault(). When true, emit returns false if the event was canceled.
 */

/**
 * @typedef {Object.<string, EmitOptions>} EmitsDefinition
 * A map of event names to their options.
 */

/**
 * Declares an emittable event with optional configuration.
 *
 * @param {EmitOptions} [options={}]
 * @returns {EmitOptions}
 *
 * @example
 * emits: {
 *     change: emitter(),
 *     selected: emitter({ bubbles: false }),
 * }
 */
export function emitter(options = {}) {
	return options;
}

/**
 * @typedef {Object} Lifecycle
 * @property {(fn: () => void) => void} onConnected - Runs after the first render, safe to access the DOM and template refs.
 * @property {(fn: () => void) => void} onDisconnected - Runs when the component is removed from the DOM.
 * @property {(fn: () => void) => void} onUpdated - Runs after every re-render.
 * @property {(fn: () => void) => void} onAdopted - Runs when the component is moved to a new document.
 * @property {(fn: (name: string, oldValue: string|null, newValue: string|null) => void) => void} onAttributeChanged - Runs when an observed attribute changes.
 * @property {(fn: (form: HTMLFormElement|null) => void) => void} onFormAssociated - Runs when the component is associated with a form element.
 * @property {(fn: () => void) => void} onFormReset - Runs when the associated form is reset.
 * @property {(fn: (disabled: boolean) => void) => void} onFormDisabled - Runs when the component is disabled via the form.
 * @property {(fn: (state: *, reason: string) => void) => void} onFormStateRestore - Runs when the browser restores the component's form state.
 */

/**
 * @template {AttrsDefinition} A
 * @template {PropsDefinition} P
 * @template {EmitsDefinition} E
 * @typedef {Object} SetupContext
 * @property {HTMLElement} el - The component's host element.
 * @property {{ [K in keyof A]: () => A[K]['default'] }} attrs - Reactive attr getters, typed from the attrs definition.
 * @property {{ [K in keyof P]: () => P[K]['default'] }} props - Reactive prop getters, typed from the props definition.
 * @property {(event: keyof E & string, detail?: *) => boolean} emit - Dispatches a declared CustomEvent from the component. Returns false if the event was canceled.
 * @property {Lifecycle} lifecycle - Lifecycle hooks for the component. Pass to composables for automatic cleanup.
 * @property {(fn: () => void) => void} track - Registers a cleanup function to be called when the component disconnects.
 * @property {ElementInternals} [internals] - The ElementInternals instance, available when formAssociated is true.
 */

/**
 * @template {AttrsDefinition} A
 * @template {PropsDefinition} P
 * @template {EmitsDefinition} E
 * @typedef {Object} ComponentOptions
 * @property {string} name
 * Custom element tag name (must contain a hyphen).
 *
 * @property {boolean} [shadow=false]
 * Attach a shadow root instead of rendering into the element directly.
 *
 * @property {boolean} [renderless=false]
 * Enables renderless mode for components that do not render a template. This is particularly useful for
 * light-dom components that progressively enhance elements that it encapsulates
 *
 * @property {A} [attrs]
 * HTML attributes to observe. Each attr is backed by a signal updated via attributeChangedCallback.
 * Available as a getter via the setup context. Optionally coerced via the type option.
 *
 * @property {P} [props]
 * JS-only props passed to the component programmatically. Each prop is wrapped in a signal
 * and available as a getter via the setup context. Falls back to its default value
 * until the property is set by a parent.
 *
 * @property {E} [emits]
 * Declares the custom events this component can dispatch. Each event is dispatched via
 * the emit function in the setup context.
 *
 * @property {(context: SetupContext<A, P, E>) => () => *} setup
 * Runs once on connect. Returns a render function that is wrapped in an effect -
 * any signals read inside will cause it to re-run.
 *
 * @property {string} [styles]
 * CSS string injected into the shadow root (shadow mode) or as a scoped `<style>` tag (light DOM).
 *
 * @property {boolean} [formAssociated=false]
 * Enables form participation via ElementInternals. When true, internals is available in the setup context.
 *
 * @property {boolean} [autoRegister=true]
 * Automatically register the component with the custom elements' registry.
 */

/**
 * Defines a native web component with optional reactive state.
 * Re-renders automatically when signals read inside the render function change.
 *
 * @template {AttrsDefinition} A
 * @template {PropsDefinition} P
 * @template {EmitsDefinition} E
 * @param {ComponentOptions<A, P, E>} options
 * @returns {typeof HTMLElement} The registered custom element class
 *
 * @example
 * import { createBit } from 'bit';
 * import { render, html } from 'bit-lit';
 *
 * const defineComponent = createBit({ renderer: render });
 *
 * const MyCounter = defineComponent({
 *   name: 'my-counter',
 *   setup: () => {
 *     const [count, setCount] = signal(0);
 *     function increment() {
 *         setCount(count() + 1);
 *     }
 *     return () => html`
 *       <button @click=${increment}>Count: ${count()}</button>
 *     `;
 *   },
 * });
 */
function defineComponent(options, config = {}) {
	const { renderer = null } = config;
	const {
		name,
		shadow = false,
		renderless = false,
		attrs = {},
		props = {},
		emits = {},
		formAssociated = false,
		setup,
		styles,
		autoRegister = true
	} = options;

	const attrKeys = Object.keys(attrs);

	class BitComponent extends HTMLElement {
		#root = shadow ? this.attachShadow({ mode: "open" }) : this;
		#connected = false;
		#firstRender = true;
		#tmpl = null;
		#cleanups = [];
		#attrSignalSetters = {};
		#resolvedAttrs = {};
		#resolvedProps = {};
		#connectedCallbacks = [];
		#disconnectedCallbacks = [];
		#adoptedCallbacks = [];
		#attrChangedCallbacks = [];
		#updatedCallbacks = [];
		#formAssociatedCallbacks = [];
		#formResetCallbacks = [];
		#formDisabledCallbacks = [];
		#formStateRestoreCallbacks = [];
		#internals = formAssociated ? this.attachInternals() : null;

		static get formAssociated() {
			return formAssociated;
		}

		static get observedAttributes() {
			return attrKeys;
		}

		constructor() {
			super();

			Object.entries(props).forEach(([key, config]) => {
				const [get, set] = signal(config.default);
				Object.defineProperty(this, key, {
					get: () => get(),
					set: (val) => set(val)
				});
				this.#resolvedProps[key] = get;
			});

			Object.entries(attrs).forEach(([key, config]) => {
				const [get, set] = signal(config.default ?? '');
				this.#attrSignalSetters[key] = set;
				this.#resolvedAttrs[key] = get;
			});
		}

		#emit(eventName, detail) {
			const config = emits[eventName] ?? {};
			return this.dispatchEvent(new CustomEvent(eventName, {
				detail,
				bubbles: config.bubbles ?? true,
				composed: config.composed ?? true,
				cancelable: config.cancelable ?? false
			}));
		}

		#track(fn) {
			this.#cleanups.push(fn);
		}

		attributeChangedCallback(attrName, oldValue, newValue) {
			if (oldValue === newValue) return;
			const setter = this.#attrSignalSetters[attrName];
			if (setter) {
				const config = attrs[attrName];
				setter(coerce(newValue, config.type));
			}
			this.#attrChangedCallbacks.forEach(fn => fn(attrName, oldValue, newValue));
		}

		adoptedCallback() {
			this.#adoptedCallbacks.forEach(fn => fn());
		}

		formAssociatedCallback(form) {
			this.#formAssociatedCallbacks.forEach(fn => fn(form));
		}

		formResetCallback() {
			this.#formResetCallbacks.forEach(fn => fn());
		}

		formDisabledCallback(disabled) {
			this.#formDisabledCallbacks.forEach(fn => fn(disabled));
		}

		formStateRestoreCallback(state, reason) {
			this.#formStateRestoreCallbacks.forEach(fn => fn(state, reason));
		}

		connectedCallback() {
			if (this.#connected) return;
			this.#connected = true;

			if (styles) {
				if (shadow) {
					const stylesheet = new CSSStyleSheet();
					stylesheet.replaceSync(styles);
					this.#root.adoptedStyleSheets = [stylesheet];
				} else {
					injectGlobalStyles(name, styles);
				}
			}

			Object.entries(attrs).forEach(([key, config]) => {
				const raw = this.getAttribute(key);
				if (raw !== null) {
					this.#attrSignalSetters[key](coerce(raw, config.type));
				}
			});

			/** @type {Lifecycle} */
			const lifecycle = {
				onConnected: (fn) => this.#connectedCallbacks.push(fn),
				onDisconnected: (fn) => this.#disconnectedCallbacks.push(fn),
				onUpdated: (fn) => this.#updatedCallbacks.push(fn),
				onAdopted: (fn) => this.#adoptedCallbacks.push(fn),
				onAttributeChanged: (fn) => this.#attrChangedCallbacks.push(fn),
				onFormAssociated: (fn) => this.#formAssociatedCallbacks.push(fn),
				onFormReset: (fn) => this.#formResetCallbacks.push(fn),
				onFormDisabled: (fn) => this.#formDisabledCallbacks.push(fn),
				onFormStateRestore: (fn) => this.#formStateRestoreCallbacks.push(fn)
			};

			this.#tmpl = setup({
				el: this,
				attrs: this.#resolvedAttrs,
				props: this.#resolvedProps,
				emit: this.#emit.bind(this),
				lifecycle,
				track: this.#track,
				internals: this.#internals
			});

			if (renderer && !renderless) {
				this.#cleanups.push(
					effect(() => {
						renderer(this.#tmpl(), this.#root);
						if (this.#firstRender) {
							this.#firstRender = false;
						} else {
							this.#updatedCallbacks.forEach(fn => fn());
						}
					})
				);
			}

			queueMicrotask(() => this.#connectedCallbacks.forEach(fn => fn()));
		}

		disconnectedCallback() {
			this.#disconnectedCallbacks.forEach(fn => fn());
			this.#cleanups.forEach((fn) => fn());
			this.#cleanups = [];
		}
	}

	if (autoRegister) customElements.define(name, BitComponent);
	return BitComponent;
}

/**
 * Injects a component's styles into the document head as a scoped `<style>` tag.
 * No-ops if a style tag for this component already exists.
 *
 * @param {string} name - The component name, used as a unique style tag id
 * @param {string} styles - CSS string to inject
 */
function injectGlobalStyles(name, styles) {
	const id = `bit-${name}`;
	if (document.getElementById(id)) return;

	const sheet = document.createElement("style");
	sheet.id = id;
	sheet.textContent = styles;
	document.head.appendChild(sheet);
}

/**
 * Coerces a raw attribute string value to the specified type.
 * Returns null if the attribute has been removed.
 * Boolean coercion treats any value except "false" as true.
 * All other types are coerced by calling type(value).
 *
 * @param {string|null} value - The raw attribute value from the DOM
 * @param {NumberConstructor|BooleanConstructor|StringConstructor} [type] - Optional constructor to coerce the value (e.g. Number, Boolean, String)
 * @returns {string|number|boolean|null} The coerced value, or the raw string if no type is provided
 */
function coerce(value, type) {
	if (value === null) return null;
	if (type === Boolean) return value !== 'false';
	if (type) return type(value);
	return value;
}
