import {html as litHtml, nothing as litNothing, render} from "../vendor/lit-html.js";
import {effect, signal} from "./reactive.js";

/**
 * @typedef {Object} TemplateResult
 * A lit-html template result returned by the `html` tagged template literal.
 * Passed to lit-html's render function to efficiently patch the DOM.
 */

/**
 * Tagged template literal for declaring HTML templates.
 * Dynamic expressions are efficiently updated in the DOM when values change.
 * Re-exported from lit-html.
 *
 * @type {function(string[], ...any): TemplateResult}
 *
 * @example
 * html`<button @click=${handler}>Count: ${count()}</button>`
 */
export const html = litHtml;

/**
 * Tagged template literal for CSS strings. Exists so editors provide
 * syntax highlighting inside the template literal.
 *
 * @param {string[]} strings
 * @param {...*} values
 * @returns {string}
 *
 * @example
 * const styles = css`
 *   p { color: red; }
 * `;
 */
export const css = (strings, ...values) =>
	String.raw({ raw: strings }, ...values);

/**
 * Sentinel value that renders nothing. Useful for conditional rendering.
 * Re-exported from lit-html.
 *
 * @type {symbol}
 *
 * @example
 * html`${isVisible ? html`<p>Hello</p>` : nothing}`
 */
export const nothing = litNothing;

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
 * @property {(fn: () => void) => void} onBeforeMount - Runs synchronously before the first render.
 * @property {(fn: () => void) => void} onMounted - Runs after the first render, safe to access the DOM and template refs.
 * @property {(fn: () => void) => void} onUnmounted - Runs when the component is removed from the DOM.
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
 * @property {(context: SetupContext<A, P, E>) => () => TemplateResult} setup
 * Runs once on connect. Returns a render function that is wrapped in an effect -
 * any signals read inside will cause it to re-run and patch only the changed DOM nodes.
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
 * Defines a native web component backed by lit-html rendering and optional reactive state.
 * Re-renders automatically when signals read inside the render function change.
 *
 * @template {AttrsDefinition} A
 * @template {PropsDefinition} P
 * @template {EmitsDefinition} E
 * @param {ComponentOptions<A, P, E>} options
 * @returns {typeof HTMLElement} The registered custom element class
 *
 * @example
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
export function defineComponent(options) {
	const {
		name,
		shadow = false,
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
		#cleanups = [];
		#attrSignalSetters = {};
		#mountedCallbacks = [];
		#unmountedCallbacks = [];
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
			if (styles) {
				if (shadow) {
					const stylesheet = new CSSStyleSheet();
					stylesheet.replaceSync(styles);
					this.#root.adoptedStyleSheets = [stylesheet];
				} else {
					injectGlobalStyles(name, styles);
				}
			}

			const resolvedAttrs = {};
			Object.entries(attrs).forEach(([key, config]) => {
				const raw = this.getAttribute(key);
				const initial = raw !== null ? coerce(raw, config.type) : (config.default ?? '');
				const [get, set] = signal(initial);
				this.#attrSignalSetters[key] = set;
				resolvedAttrs[key] = get;
			});

			const resolvedProps = {};
			Object.entries(props).forEach(([key, config]) => {
				const [get, set] = signal(config.default);
				Object.defineProperty(this, key, {
					get: () => get(),
					set: (val) => set(val),
					configurable: true
				});
				resolvedProps[key] = get;
			});

			function emit(eventName, detail) {
				const config = emits[eventName] ?? {};
				return this.dispatchEvent(new CustomEvent(eventName, {
					detail,
					bubbles: config.bubbles ?? true,
					composed: config.composed ?? true,
					cancelable: config.cancelable ?? false
				}));
			}

			/**
			 * @type Lifecycle
			 */
			const lifecycle = {
				onBeforeMount: (fn) => fn(),
				onMounted: (fn) => this.#mountedCallbacks.push(fn),
				onUnmounted: (fn) => this.#unmountedCallbacks.push(fn),
				onUpdated: (fn) => this.#updatedCallbacks.push(fn),
				onAdopted: (fn) => this.#adoptedCallbacks.push(fn),
				onAttributeChanged: (fn) => this.#attrChangedCallbacks.push(fn),
				onFormAssociated: (fn) => this.#formAssociatedCallbacks.push(fn),
				onFormReset: (fn) => this.#formResetCallbacks.push(fn),
				onFormDisabled: (fn) => this.#formDisabledCallbacks.push(fn),
				onFormStateRestore: (fn) => this.#formStateRestoreCallbacks.push(fn)
			};

			const tmpl = setup({
				el: this,
				attrs: resolvedAttrs,
				props: resolvedProps,
				emit: emit.bind(this),
				lifecycle,
				internals: this.#internals
			});

			this.#cleanups.push(
				effect(() => {
					render(tmpl(), this.#root);
					this.#updatedCallbacks.forEach(fn => fn());
				})
			);

			queueMicrotask(() => this.#mountedCallbacks.forEach(fn => fn()));
		}

		disconnectedCallback() {
			this.#unmountedCallbacks.forEach(fn => fn());
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
