import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class PremiumLicenseInput extends LitElement {
    static styles = css`
        :host {
            display: block;
        }

        .field {
            display: flex;
            flex-direction: column;
            gap: var(--space-sm);
        }

        .label-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .label {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-secondary);
        }

        .input-row {
            display: flex;
            gap: var(--space-sm);
            align-items: stretch;
        }

        .input-shell {
            position: relative;
            flex: 1;
            min-width: 0;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-elevated);
            transition:
                border-color var(--transition),
                box-shadow var(--transition),
                background var(--transition);
        }

        .input-shell:focus-within {
            border-color: var(--tally);
            box-shadow: 0 0 0 1px var(--tally-glow);
            background: var(--bg-hover);
        }

        .input-shell.error {
            border-color: var(--danger);
            box-shadow: 0 0 0 1px rgba(196, 30, 58, 0.25);
        }

        .input {
            width: 100%;
            border: none;
            background: transparent;
            color: var(--text-primary);
            font-family: var(--font-mono);
            font-size: var(--font-size-sm);
            padding: 12px 44px 12px 14px;
            outline: none;
            cursor: text;
            user-select: text;
            -webkit-user-select: text;
        }

        .input::placeholder {
            color: var(--text-muted);
        }

        .toggle-visibility {
            position: absolute;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--text-muted);
            cursor: pointer;
            transition:
                color var(--transition),
                background var(--transition);
        }

        .toggle-visibility:hover {
            color: var(--text-secondary);
            background: rgba(247, 247, 242, 0.06);
        }

        .toggle-visibility:focus-visible {
            outline: 2px solid var(--tally);
            outline-offset: 1px;
        }

        .activate-button {
            flex-shrink: 0;
            border: none;
            border-radius: var(--radius-sm);
            padding: 12px 18px;
            background: var(--tally);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            cursor: pointer;
            transition:
                background var(--transition),
                transform var(--transition),
                opacity var(--transition);
        }

        .activate-button:hover:not(:disabled) {
            background: var(--tally-hover);
        }

        .activate-button:active:not(:disabled) {
            transform: scale(0.98);
        }

        .activate-button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .hint {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            line-height: 1.4;
        }

        .hint.error {
            color: var(--danger);
        }

        @media (max-width: 520px) {
            .input-row {
                flex-direction: column;
            }

            .activate-button {
                width: 100%;
            }
        }
    `;

    static properties = {
        value: { type: String },
        placeholder: { type: String },
        hint: { type: String },
        error: { type: String },
        busy: { type: Boolean },
        _revealed: { state: true },
    };

    constructor() {
        super();
        this.value = '';
        this.placeholder = 'MENACE_…';
        this.hint = '';
        this.error = '';
        this.busy = false;
        this._revealed = false;
    }

    _handleInput(event) {
        this.value = event.target.value;
        this.dispatchEvent(
            new CustomEvent('value-change', {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            })
        );
    }

    _handleKeydown(event) {
        if (event.key === 'Enter') {
            this._handleActivate();
        }
    }

    _handleActivate() {
        if (this.busy) return;
        this.dispatchEvent(
            new CustomEvent('activate', {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            })
        );
    }

    _toggleVisibility() {
        this._revealed = !this._revealed;
    }

    render() {
        const message = this.error || this.hint;

        return html`
            <div class="field">
                <div class="label-row">
                    <span class="label">License key</span>
                </div>
                <div class="input-row">
                    <div class="input-shell ${this.error ? 'error' : ''}">
                        <input
                            class="input"
                            type=${this._revealed ? 'text' : 'password'}
                            spellcheck="false"
                            autocomplete="off"
                            placeholder=${this.placeholder}
                            .value=${this.value}
                            @input=${this._handleInput}
                            @keydown=${this._handleKeydown}
                        />
                        <button
                            type="button"
                            class="toggle-visibility"
                            aria-label=${this._revealed ? 'Hide license key' : 'Show license key'}
                            @click=${this._toggleVisibility}
                        >
                            ${
                                this._revealed
                                    ? html`
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.75" />
                                              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75" />
                                          </svg>
                                      `
                                    : html`
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                              <path
                                                  d="M3 3l18 18M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a18.45 18.45 0 0 1-2.16 3.19M6.12 6.12A18.45 18.45 0 0 0 2 12s3.5 7 10 7a10.94 10.94 0 0 0 4.12-.88"
                                                  stroke="currentColor"
                                                  stroke-width="1.75"
                                                  stroke-linecap="round"
                                              />
                                          </svg>
                                      `
                            }
                        </button>
                    </div>
                    <button type="button" class="activate-button" ?disabled=${this.busy} @click=${() => this._handleActivate()}>
                        ${this.busy ? 'Checking…' : 'Activate'}
                    </button>
                </div>
                ${message ? html`<div class="hint ${this.error ? 'error' : ''}">${message}</div>` : ''}
            </div>
        `;
    }
}

customElements.define('premium-license-input', PremiumLicenseInput);
