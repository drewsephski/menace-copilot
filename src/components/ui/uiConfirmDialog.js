import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import './uiButton.js';

export class UiConfirmDialog extends LitElement {
    static styles = css`
        :host {
            display: contents;
        }

        .backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10002;
            padding: var(--space-md);
            pointer-events: auto;
            overscroll-behavior: contain;
            animation: confirm-fade-in 200ms ease;
        }

        .panel {
            width: min(440px, 100%);
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: var(--space-md);
            display: flex;
            flex-direction: column;
            gap: var(--space-sm);
            animation: confirm-slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .panel.tone-delete,
        .panel.tone-remove {
            border-color: color-mix(in srgb, var(--danger) 45%, var(--border));
        }

        @keyframes confirm-fade-in {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        @keyframes confirm-slide-in {
            from {
                opacity: 0;
                transform: translateY(8px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .title {
            font-size: var(--font-size-md);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .description {
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
            line-height: 1.5;
        }

        .actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--space-sm);
            flex-wrap: wrap;
            margin-top: var(--space-xs);
        }

        @media (prefers-reduced-motion: reduce) {
            .backdrop,
            .panel {
                animation: none;
            }
        }
    `;

    static properties = {
        open: { type: Boolean, reflect: true },
        title: { type: String },
        description: { type: String },
        confirmLabel: { type: String, attribute: 'confirm-label' },
        cancelLabel: { type: String, attribute: 'cancel-label' },
        tone: { type: String },
        loading: { type: Boolean, reflect: true },
        loadingLabel: { type: String, attribute: 'loading-label' },
    };

    constructor() {
        super();
        this.open = false;
        this.title = '';
        this.description = '';
        this.confirmLabel = 'Confirm';
        this.cancelLabel = 'Cancel';
        this.tone = 'delete';
        this.loading = false;
        this.loadingLabel = '';
        this._previousOverflow = undefined;
        this._handleKeydown = event => {
            if (!this.open || this.loading) {
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                this._handleCancel();
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this._handleKeydown, true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._handleKeydown, true);
        if (this._previousOverflow !== undefined) {
            document.documentElement.style.overflow = this._previousOverflow;
            this._previousOverflow = undefined;
        }
    }

    updated(changed) {
        if (!changed.has('open')) {
            return;
        }

        if (this.open) {
            this._previousOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';
            return;
        }

        if (this._previousOverflow !== undefined) {
            document.documentElement.style.overflow = this._previousOverflow;
            this._previousOverflow = undefined;
        }
    }

    _handleBackdropClick(event) {
        if (event.target !== event.currentTarget || this.loading) {
            return;
        }
        this._handleCancel();
    }

    _handleCancel() {
        if (this.loading) {
            return;
        }
        this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
    }

    _handleConfirm() {
        if (this.loading) {
            return;
        }
        this.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
    }

    render() {
        if (!this.open) {
            return html``;
        }

        const titleId = 'ui-confirm-dialog-title';

        return html`
            <div class="backdrop" @click=${this._handleBackdropClick}>
                <div
                    class="panel tone-${this.tone}"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby=${titleId}
                    @click=${event => event.stopPropagation()}
                >
                    <div id=${titleId} class="title">${this.title}</div>
                    ${this.description ? html`<div class="description">${this.description}</div>` : ''}
                    <div class="actions">
                        <ui-button variant="ghost" ?disabled=${this.loading} @ui-click=${this._handleCancel}>${this.cancelLabel}</ui-button>
                        <ui-button
                            variant="destructive"
                            ?loading=${this.loading}
                            loading-label=${this.loadingLabel || this.confirmLabel}
                            @ui-click=${this._handleConfirm}
                        >
                            ${this.confirmLabel}
                        </ui-button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('ui-confirm-dialog', UiConfirmDialog);
