import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class UiButton extends LitElement {
    static styles = css`
        :host {
            display: inline-flex;
            cursor: pointer;
        }

        :host([block]) {
            display: flex;
            width: 100%;
        }

        :host([disabled]),
        :host([loading]) {
            pointer-events: none;
        }

        :host([disabled]) {
            cursor: not-allowed;
        }

        :host([loading]) {
            cursor: wait;
        }

        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: var(--radius-sm);
            font-family: var(--font);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            line-height: 1;
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
            border: 1px solid transparent;
            position: relative;
            overflow: hidden;
            transition:
                background var(--transition),
                border-color var(--transition),
                color var(--transition),
                opacity var(--transition),
                transform 120ms ease,
                box-shadow 120ms ease;
        }

        button:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
        }

        button:active:not(:disabled) {
            transform: scale(0.97);
        }

        button.variant-default:active:not(:disabled) {
            box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.22);
        }

        button:disabled {
            opacity: 0.55;
            cursor: not-allowed;
            pointer-events: none;
        }

        :host([loading]) button {
            cursor: wait;
        }

        :host([success]) button.variant-default {
            background: var(--success);
            border-color: var(--success);
            color: var(--bg-app);
        }

        :host([success]) button.variant-outline,
        :host([success]) button.variant-secondary {
            border-color: var(--success);
            color: var(--success);
        }

        /* Sizes */
        button.size-default {
            height: 36px;
            padding: 0 14px;
            min-width: 36px;
        }

        button.size-sm {
            height: 32px;
            padding: 0 12px;
            font-size: var(--font-size-xs);
            min-width: 32px;
        }

        /* Variants */
        button.variant-default {
            background: var(--tally);
            color: var(--text-primary);
            border-color: var(--tally);
        }

        button.variant-default:hover:not(:disabled) {
            background: var(--tally-hover);
            border-color: var(--tally-hover);
        }

        button.variant-outline {
            background: transparent;
            color: var(--text-primary);
            border-color: var(--border-strong);
        }

        button.variant-outline:hover:not(:disabled) {
            background: var(--bg-hover);
            border-color: var(--border-strong);
        }

        button.variant-secondary {
            background: var(--bg-elevated);
            color: var(--text-primary);
            border-color: var(--border);
        }

        button.variant-secondary:hover:not(:disabled) {
            background: var(--bg-hover);
            border-color: var(--border-strong);
        }

        button.variant-ghost {
            background: transparent;
            color: var(--text-secondary);
            border-color: transparent;
        }

        button.variant-ghost:hover:not(:disabled) {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        button.variant-destructive {
            background: transparent;
            color: var(--danger);
            border-color: var(--danger);
        }

        button.variant-destructive:hover:not(:disabled) {
            background: var(--tally-dim);
        }

        .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid currentColor;
            border-right-color: transparent;
            border-radius: 50%;
            animation: ui-button-spin 600ms linear infinite;
            flex-shrink: 0;
            opacity: 0.9;
        }

        .success-icon {
            width: 14px;
            height: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: var(--font-weight-semibold);
            flex-shrink: 0;
        }

        .label,
        ::slotted(*) {
            pointer-events: none;
        }

        .label {
            display: inline-flex;
            align-items: center;
        }

        @keyframes ui-button-spin {
            to {
                transform: rotate(360deg);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            button,
            .spinner {
                transition: none;
                animation: none;
            }

            button:active:not(:disabled) {
                transform: none;
            }
        }
    `;

    static properties = {
        variant: { type: String },
        size: { type: String },
        loading: { type: Boolean, reflect: true },
        success: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        type: { type: String },
        block: { type: Boolean, reflect: true },
        loadingLabel: { type: String, attribute: 'loading-label' },
    };

    constructor() {
        super();
        this.variant = 'outline';
        this.size = 'default';
        this.loading = false;
        this.success = false;
        this.disabled = false;
        this.type = 'button';
        this.block = false;
        this.loadingLabel = '';
        this._hostClickListener = event => this._handleClick(event);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', this._hostClickListener);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('click', this._hostClickListener);
    }

    _handleClick(event) {
        if (this.loading || this.disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const button = this.shadowRoot?.querySelector('button');

        if (this.type === 'submit') {
            const clickedShadowButton = Boolean(button && event.composedPath().includes(button));
            if (!clickedShadowButton && button) {
                button.click();
            }
            return;
        }

        this.dispatchEvent(
            new CustomEvent('ui-click', {
                bubbles: true,
                composed: true,
            })
        );
    }

    _renderLabel() {
        if (this.loading) {
            return this.loadingLabel || html`<slot></slot>`;
        }
        return html`<slot></slot>`;
    }

    render() {
        const isDisabled = this.disabled || this.loading;

        return html`
            <button
                type=${this.type}
                class="variant-${this.variant} size-${this.size}"
                ?disabled=${isDisabled}
                aria-busy=${this.loading ? 'true' : 'false'}
            >
                ${this.loading ? html`<span class="spinner" aria-hidden="true"></span>` : ''}
                ${!this.loading && this.success ? html`<span class="success-icon" aria-hidden="true">✓</span>` : ''}
                <span class="label">${this._renderLabel()}</span>
            </button>
        `;
    }
}

customElements.define('ui-button', UiButton);
