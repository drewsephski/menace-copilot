import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { unifiedPageStyles } from './sharedPageStyles.js';
import '../ui/premiumPlanPicker.js';
import '../ui/premiumLicenseInput.js';

export class UnlockView extends LitElement {
    static styles = [
        unifiedPageStyles,
        css`
            .status-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-md);
            }

            .status-copy {
                min-width: 0;
            }

            .status-card {
                position: relative;
                overflow: hidden;
            }

            .status-card::before {
                content: '';
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at top right, rgba(196, 30, 58, 0.12), transparent 55%);
                pointer-events: none;
            }

            .status-card.ready::before {
                background: radial-gradient(circle at top right, rgba(90, 171, 110, 0.14), transparent 55%);
            }

            .pill.ready {
                border-color: rgba(90, 171, 110, 0.35);
                color: var(--success);
            }

            .ghost-button {
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 12px 16px;
                background: transparent;
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-semibold);
                cursor: pointer;
                transition:
                    color var(--transition),
                    background var(--transition),
                    border-color var(--transition);
            }

            .ghost-button:hover {
                color: var(--text-primary);
                background: var(--bg-hover);
                border-color: var(--border-strong);
            }

            .portal-link {
                margin-bottom: var(--space-sm);
            }

            .checkout-error {
                margin-top: var(--space-sm);
                color: var(--danger);
                font-size: var(--font-size-xs);
            }
        `,
    ];

    static properties = {
        license: { type: Object },
        _key: { state: true },
        _busy: { type: Boolean, state: true },
        _checkoutBusy: { type: Boolean, state: true },
        _activationError: { type: String, state: true },
        _checkoutError: { type: String, state: true },
        _selectedSku: { type: String, state: true },
    };

    constructor() {
        super();
        this.license = { valid: false, status: 'missing' };
        this._key = '';
        this._busy = false;
        this._checkoutBusy = false;
        this._activationError = '';
        this._checkoutError = '';
        this._selectedSku = 'search_pass';
    }

    get _statusLabel() {
        if (this.license?.skipped) return 'Dev skip';
        if (this.license?.valid) return this.license.stale ? 'Active (offline)' : 'Active';
        if (this.license?.status === 'expired') return 'Expired';
        if (this.license?.status === 'revoked') return 'Cancelled';
        return 'Locked';
    }

    async _openCheckout(sku) {
        this._checkoutError = '';
        this._checkoutBusy = true;
        const result = await cheatingDaddy.license.openCheckout(sku || this._selectedSku);
        this._checkoutBusy = false;
        if (!result.success) {
            this._checkoutError = result.error || 'Could not open checkout.';
        }
        this.requestUpdate();
    }

    async _openPortal() {
        this._checkoutError = '';
        this._activationError = '';
        const result = await cheatingDaddy.license.openPortal();
        if (!result.success) {
            this._checkoutError = result.error || 'Could not open Polar portal.';
        }
    }

    async _handleActivate() {
        if (this._busy) return;
        this._busy = true;
        this._activationError = '';
        const result = await cheatingDaddy.license.activate(this._key);
        this._busy = false;

        if (!result.success) {
            this._activationError = result.error || 'Could not activate that key.';
            this.requestUpdate();
            return;
        }

        this._key = '';
        this.license = result.status;
        this.dispatchEvent(new CustomEvent('license-changed', { detail: result.status, bubbles: true, composed: true }));
        this.requestUpdate();
    }

    async _handleClear() {
        const status = await cheatingDaddy.license.clear();
        this.license = status;
        this.dispatchEvent(new CustomEvent('license-changed', { detail: status, bubbles: true, composed: true }));
    }

    _handleKeyChange(event) {
        this._key = event.detail.value;
        this._activationError = '';
    }

    _handlePlanSelect(event) {
        this._selectedSku = event.detail.sku;
        this._checkoutError = '';
    }

    _expiresCopy() {
        if (!this.license?.expiresAt) {
            return this.license?.valid ? 'Renews with the monthly plan, or until cancelled.' : '';
        }

        const date = new Date(this.license.expiresAt);
        if (Number.isNaN(date.getTime())) return '';
        return `Expires ${date.toLocaleDateString()}`;
    }

    render() {
        const activationError = this._activationError || '';
        const checkoutError = this._checkoutError || this.license?.error || '';
        const activated = Boolean(this.license?.valid);

        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div>
                        <div class="page-title">License</div>
                        <div class="page-subtitle">
                            Every plan unlocks Menace Agent — even BYOK. Full passes include AI answers; BYOK ($15/mo) uses your own Gemini and
                            OpenRouter keys. Copy your MENACE key from Polar after checkout.
                        </div>
                    </div>

                    <section class="surface status-card ${activated ? 'ready' : ''}">
                        <div class="status-row">
                            <div class="status-copy">
                                <div class="surface-title">${this._statusLabel}</div>
                                <div class="surface-subtitle">
                                    ${this.license?.displayKey || 'No key on this Mac yet'}
                                    ${this._expiresCopy() ? html`<br />${this._expiresCopy()}` : ''}
                                </div>
                            </div>
                            <span class="pill ${activated ? 'ready' : ''}">${activated ? 'Ready' : 'Paywall'}</span>
                        </div>
                    </section>

                    ${
                        activated
                            ? html`
                                  <section class="surface">
                                      <div class="surface-title">This Mac</div>
                                      <div class="surface-subtitle">Keys are limited to two devices. Removing the key here does not refund.</div>
                                      <button class="ghost-button" @click=${() => this._handleClear()}>Remove license from this Mac</button>
                                  </section>
                              `
                            : html`
                                  <section class="surface">
                                      <div class="surface-title">Choose a pass</div>
                                      <div class="surface-subtitle">
                                          ${
                                              this.license?.sandbox
                                                  ? 'Sandbox checkout. Use card 4242 4242 4242 4242.'
                                                  : 'Select a pass, then checkout in your browser. Your MENACE_ key is in the Polar portal or email.'
                                          }
                                      </div>
                                      <premium-plan-picker
                                          selected-sku=${this._selectedSku}
                                          ?busy=${this._checkoutBusy}
                                          @plan-select=${this._handlePlanSelect}
                                          @checkout=${event => this._openCheckout(event.detail.sku)}
                                      ></premium-plan-picker>
                                      ${checkoutError ? html`<div class="checkout-error">${checkoutError}</div>` : ''}
                                  </section>

                                  <section class="surface">
                                      <div class="surface-title">Get your key</div>
                                      <div class="surface-subtitle">
                                          Open Polar → Purchases → copy your license key, or check your confirmation email.
                                      </div>
                                      <button class="ghost-button portal-link" @click=${() => this._openPortal()}>Open Polar customer portal</button>
                                  </section>

                                  <section class="surface">
                                      <premium-license-input
                                          .value=${this._key}
                                          ?busy=${this._busy}
                                          .error=${activationError}
                                          hint=${
                                              this.license?.sandbox
                                                  ? 'Sandbox checkout: use card 4242 4242 4242 4242.'
                                                  : 'Already paid? Paste your key, then activate.'
                                          }
                                          @value-change=${this._handleKeyChange}
                                          @activate=${() => this._handleActivate()}
                                      ></premium-license-input>
                                  </section>
                              `
                    }
                </div>
            </div>
        `;
    }
}

customElements.define('unlock-view', UnlockView);
