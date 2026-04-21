import {
    html as litHtml,
    nothing as litNothing,
    render as litRender
} from "../vendor/lit-html.js";

/**
 * @typedef {Object} TemplateResult
 * A lit-html template result returned by the `html` tagged template literal.
 * Passed to lit-html's render function to efficiently patch the DOM.
 */

/**
 * Renders a template result into a container. Re-exported from lit-html.
 *
 * @param {TemplateResult} template
 * @param {Element | ShadowRoot} container
 */
export const render = litRender;

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