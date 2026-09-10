import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class UiToast extends LitElement {
    static styles = css`
        :host {
            position: fixed;
            bottom: 24px;
            left: 50%;
            z-index: 10001;
            transform: translateX(-50%) translateY(calc(100% + 24px));
            opacity: 0;
            pointer-events: none;
            transition:
                transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity 180ms ease;
        }

        :host([open]) {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        .toast {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            max-width: min(420px, calc(100vw - 32px));
            padding: 12px 16px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-strong);
            background: var(--bg-surface);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
            line-height: 1.4;
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.35),
                0 0 0 1px rgba(255, 255, 255, 0.04) inset;
        }

        .toast.success {
            border-color: color-mix(in srgb, var(--success) 55%, var(--border));
            background: color-mix(in srgb, var(--success) 12%, var(--bg-surface));
        }

        .toast.error {
            border-color: color-mix(in srgb, var(--danger) 55%, var(--border));
            background: color-mix(in srgb, var(--danger) 12%, var(--bg-surface));
        }

        .icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            flex-shrink: 0;
            font-size: 11px;
            font-weight: var(--font-weight-semibold);
        }

        .toast.success .icon {
            background: color-mix(in srgb, var(--success) 22%, transparent);
            color: var(--success);
        }

        .toast.error .icon {
            background: color-mix(in srgb, var(--danger) 22%, transparent);
            color: var(--danger);
        }

        .message {
            min-width: 0;
        }

        @media (prefers-reduced-motion: reduce) {
            :host {
                transition: none;
            }
        }
    `;

    static properties = {
        open: { type: Boolean, reflect: true },
        message: { type: String },
        variant: { type: String },
        duration: { type: Number },
    };

    constructor() {
        super();
        this.open = false;
        this.message = '';
        this.variant = 'success';
        this.duration = 3200;
        this._dismissTimer = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._clearDismissTimer();
    }

    updated(changed) {
        if (changed.has('open') || changed.has('duration')) {
            this._scheduleDismiss();
        }
    }

    _clearDismissTimer() {
        if (this._dismissTimer) {
            clearTimeout(this._dismissTimer);
            this._dismissTimer = null;
        }
    }

    _scheduleDismiss() {
        this._clearDismissTimer();
        if (!this.open || this.duration <= 0) {
            return;
        }
        this._dismissTimer = setTimeout(() => {
            this.open = false;
            this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true, composed: true }));
        }, this.duration);
    }

    _iconLabel() {
        if (this.variant === 'error') {
            return '!';
        }
        return '✓';
    }

    render() {
        if (!this.message) {
            return html``;
        }

        return html`
            <div class="toast ${this.variant}" role="status" aria-live="polite" aria-atomic="true">
                <span class="icon" aria-hidden="true">${this._iconLabel()}</span>
                <span class="message">${this.message}</span>
            </div>
        `;
    }
}

customElements.define('ui-toast', UiToast);
