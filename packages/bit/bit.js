import {
	html as litHtml,
	nothing as litNothing,
	render
} from "../vendor/lit-html.js";
import { signal, effect } from "./reactive.js";

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
 * @typedef {Object} PropOptions
 * @property {*} default - The default value for the prop, used until the property is set.
 */

/**
 * @typedef {Object.<string, PropOptions>} PropsDefinition
 * A map of prop names to their options.
 *
 * @example
 * props: {
 *     user: { default: null },
 *     count: { default: 0 }
 * }
 */

/**
 * @typedef {Object} AttrOptions
 * @property {string} [default=''] - The default value if the attribute is not present.
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
 * @typedef {Object} SetupContext
 * @property {HTMLElement} el - The component's host element.
 * @property {Object.<string, () => *>} props - Reactive prop getters, each returning the current prop value or its default.
 * @property {Object.<string, () => *>} attrs - Reactive attr getters, each returning the current attribute value or its default.
 */

/**
 * @typedef {Object} ComponentOptions
 * @property {string} name
 * Custom element tag name (must contain a hyphen).
 *
 * @property {boolean} [shadow=false]
 * Attach a shadow root instead of rendering into the element directly.
 *
 * @property {PropsDefinition} [props]
 * JS-only props passed to the component programmatically. Each prop is wrapped in a signal
 * and available as a getter via the setup context. Falls back to its default value
 * until the property is set by a parent.
 *
 * @property {AttrsDefinition} [attrs]
 * HTML attributes to observe. Each attr is backed by a signal updated via attributeChangedCallback.
 * Available as a getter via the setup context. Optionally coerced via the type option.
 *
 * @property {(context: SetupContext) => () => TemplateResult} setup
 * Runs once on connect. Returns a render function that is wrapped in an effect -
 * any signals read inside will cause it to re-run and patch only the changed DOM nodes.
 *
 * @property {string} [styles]
 * CSS string injected into the shadow root (shadow mode) or as a scoped `<style>` tag (light DOM).
 *
 * @property {boolean} [autoRegister=true]
 * Automatically register the component with the custom elements registry.
 */

/**
 * Defines a native web component backed by lit-html rendering and optional reactive state.
 * Re-renders automatically when signals read inside the render function change.
 *
 * @param {ComponentOptions} options
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
		props = {},
		attrs = {},
		setup,
		styles,
		autoRegister = true
	} = options;

	const attrKeys = Object.keys(attrs);

	class BitComponent extends HTMLElement {
		#root = shadow ? this.attachShadow({ mode: "open" }) : this;
		#cleanups = [];
		#attrSignalSetters = {};

		static get observedAttributes() {
			return attrKeys;
		}

		attributeChangedCallback(attrName, _oldValue, newValue) {
			const setter = this.#attrSignalSetters[attrName];
			if (setter) {
				const config = attrs[attrName];
				setter(coerce(newValue, config.type));
			}
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

			const resolvedAttrs = {};
			Object.entries(attrs).forEach(([key, config]) => {
				const raw = this.getAttribute(key);
				const initial = raw !== null ? coerce(raw, config.type) : (config.default ?? '');
				const [get, set] = signal(initial);
				this.#attrSignalSetters[key] = set;
				resolvedAttrs[key] = get;
			});

			const tmpl = setup({
				el: this,
				props: resolvedProps,
				attrs: resolvedAttrs
			});

			this.#cleanups.push(
				effect(() => render(tmpl(), this.#root))
			);
		}

		disconnectedCallback() {
			this.#cleanups.forEach((fn) => fn());
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
