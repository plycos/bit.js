import {html, nothing, render} from './vendor/lit-html.js';
import {Signal} from './vendor/signal-polyfill.js';

export {html, nothing}

export function signal(value) {
    const s = new Signal.State(value);
    return [
        () => s.get(),
        (val) => s.set(val)
    ];
}

export function computed(fn) {
    const c = new Signal.Computed(fn)
    return () => c.get();
}

export function effect(fn) {
    const computed = new Signal.Computed(fn);

    const watcher = new Signal.subtle.Watcher(() => {
        queueMicrotask(run);
    });

    function run() {
        watcher.watch();
        computed.get();
    }

    watcher.watch(computed);
    computed.get();

    return () => watcher.unwatch(computed);
}

export function watch(source, callback) {
    const getter = Array.isArray(source)
        ? () => source.map(s => s())
        : source;

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
    })
}

export const css = (strings, ...values) =>
    String.raw({raw: strings}, ...values);

/**
 * @typedef {Object} ComponentOptions
 * @property {string} name - The name of the component
 * @property {boolean} [shadow=false] - Sets component to use shadow root
 * @property {function({el: HTMLElement}): Object} [setup] - Component logic; receives the element and returns state/methods for the template
 * @property {string|function(Object): string} template - The component markup, or a function receiving setup's return value that returns markup
 * @property {string} [styles] - The component css stylesheet
 */

/**
 * Factory function for creating native web components.
 *
 * Uses lit-html for string based templating for a nicer developer experience.
 *
 * @param {ComponentOptions} options
 */
export function defineComponent(options) {
    const {
        name,
        shadow,
        setup,
        template,
        styles
    } = options;
    customElements.define(name, class extends HTMLElement {
        #root = shadow ? this.attachShadow({mode: 'open'}) : this;
        #cleanup = null;

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

            const state = setup ? setup({el: this}) : {};
            const tmpl = typeof template === 'function' ? template : () => template;
            this.#cleanup = effect(() => render(tmpl(state), this.#root));
        }

        disconnectedCallback() {
            this.#cleanup?.();
        }
    });
}

function injectGlobalStyles(name, styles) {
    const id = `bit-${name}`
    if (document.getElementById(id)) return

    const sheet = document.createElement('style')
    sheet.id = id
    sheet.textContent = styles
    document.head.appendChild(sheet)
}
