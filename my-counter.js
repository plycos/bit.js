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
    attrs: {
        step: { default: 1, type: Number },
        label: { default: 'Counter' }
    },
    props: {
        buttonText: { default: 'Increment' }
    },
    emits: {
        increment: {}
    },
    setup: ({ props, attrs, emit }) => {
        const [count, setCount] = signal(0);
        const double = computed(() => count() * 2);
        const triple = computed(() => count() * 3);
        const items = [];

        watch(count, () => {
           items.push(count());
        });

        function increment() {
            setCount(count() + attrs.step());
            emit('increment', { count: count() });
        }

        return () => html`
            <h3>${attrs.label()}</h3>
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
