import {
    defineComponent,
    html,
    css
} from './packages/bit/bit.js';
import {
    signal,
    computed,
    watch
} from './packages/bit/reactive.js';

const myCounter = defineComponent({
    name: 'my-counter',
    shadow: false,
    props: {
        buttonText: { default: 'Increment' }
    },
    setup: ({ props }) => {
        const [count, setCount] = signal(0);
        const double = computed(() => count() * 2);
        const triple = computed(() => count() * 3);
        const items = [];

        watch(count, () => {
           items.push(count());
        });

        function increment() {
            setCount(count() + 1);
        }

        return () => html`
            <button @click=${increment}>${props.buttonText()}</button>
            <p>Count: ${count()}</p>
            <p>Double: ${double()}</p>
            <p>Triple: ${triple()}</p>
            ${items.map((item) => html`<p>${item}</p>`)}
        `;
    },
    styles: css`
        :host {
            display: flex;
        }
        
        p {
            color: red;
            font-weight: bold;
        }
    `
});
