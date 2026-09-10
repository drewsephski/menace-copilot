import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

const DEFAULT_PLANS = [
    {
        sku: 'search_pass',
        name: '90-Day Pass',
        price: 79,
        note: '90 days · included AI',
        popular: false,
        highlights: ['AI included', 'No API keys', 'Best value'],
    },
    {
        sku: 'monthly',
        name: 'Monthly',
        price: 39,
        note: 'Cancel anytime · included AI',
        popular: true,
        highlights: ['AI included', 'No API keys', 'Live overlay'],
    },
    {
        sku: 'byok_monthly',
        name: 'BYOK',
        price: 15,
        note: 'Bring your own API keys',
        popular: false,
        highlights: ['Your Gemini key', 'Your OpenRouter key', 'App license'],
    },
];

export class PremiumPlanPicker extends LitElement {
    static styles = css`
        :host {
            display: block;
        }

        .picker {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
        }

        .plan-stack {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .plan-ring {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            height: 0;
            border: 1px solid var(--tally);
            border-radius: var(--radius-sm);
            pointer-events: none;
            transition:
                top 280ms cubic-bezier(0.22, 1, 0.36, 1),
                height 280ms cubic-bezier(0.22, 1, 0.36, 1);
            z-index: 2;
            box-sizing: border-box;
        }

        .plan-card {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
            width: 100%;
            padding: 14px 16px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-elevated);
            color: var(--text-primary);
            text-align: left;
            cursor: pointer;
            transition:
                background var(--transition),
                border-color var(--transition);
        }

        .plan-card:hover {
            background: var(--bg-hover);
            border-color: var(--border-strong);
        }

        .plan-card:focus-visible {
            outline: 2px solid var(--tally);
            outline-offset: 2px;
        }

        .plan-copy {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }

        .plan-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .plan-name {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
        }

        .plan-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--tally-dim);
            background: rgba(196, 30, 58, 0.12);
            color: var(--text-primary);
            font-size: 10px;
            font-weight: var(--font-weight-semibold);
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .plan-price-row {
            display: flex;
            align-items: baseline;
            gap: 4px;
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
        }

        .plan-price {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            letter-spacing: -0.02em;
            transition: color 280ms ease;
        }

        .plan-note {
            color: var(--text-muted);
        }

        .plan-radio {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid var(--border-strong);
            display: grid;
            place-items: center;
            line-height: 0;
            transition:
                border-color 280ms ease,
                box-shadow 280ms ease;
        }

        .plan-radio-dot {
            display: block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--tally);
            opacity: 0;
            transform: scale(0);
            transform-origin: center;
            transition:
                opacity 280ms ease,
                transform 280ms ease;
        }

        .plan-card.selected .plan-radio {
            border-color: var(--tally);
        }

        .plan-card.selected .plan-radio-dot {
            opacity: 1;
            transform: scale(1);
        }

        .plan-card.selected .plan-price {
            color: var(--text-primary);
        }

        .highlights {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
        }

        .highlight {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 8px;
            border-radius: var(--radius-sm);
            background: rgba(247, 247, 242, 0.04);
            color: var(--text-muted);
            font-size: 10px;
            line-height: 1.3;
        }

        .highlight-dot {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--text-secondary);
            flex-shrink: 0;
        }

        .checkout-cta {
            width: 100%;
            border: none;
            border-radius: var(--radius-sm);
            padding: 12px 16px;
            background: var(--tally);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            cursor: pointer;
            transition:
                background var(--transition),
                transform var(--transition),
                opacity 280ms ease;
        }

        .checkout-cta:hover {
            background: var(--tally-hover);
        }

        .checkout-cta:active {
            transform: scale(0.98);
        }

        .checkout-cta:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        @media (max-width: 520px) {
            .highlights {
                grid-template-columns: 1fr;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .plan-ring,
            .plan-card,
            .plan-radio,
            .plan-radio-dot,
            .plan-price,
            .checkout-cta {
                transition: none;
            }
        }
    `;

    static properties = {
        plans: { type: Array },
        selectedSku: { type: String, attribute: 'selected-sku' },
        busy: { type: Boolean },
    };

    constructor() {
        super();
        this.plans = DEFAULT_PLANS;
        this.selectedSku = 'search_pass';
        this.busy = false;
        this._resizeObserver = null;
    }

    firstUpdated() {
        this._setupRingObserver();
        this._syncRingPosition();
    }

    updated(changed) {
        if (changed.has('selectedSku') || changed.has('plans')) {
            this.updateComplete.then(() => this._syncRingPosition());
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver?.disconnect();
    }

    _setupRingObserver() {
        const stack = this.renderRoot.querySelector('.plan-stack');
        if (!stack || typeof ResizeObserver === 'undefined') return;

        this._resizeObserver = new ResizeObserver(() => this._syncRingPosition());
        this._resizeObserver.observe(stack);
        stack.querySelectorAll('.plan-card').forEach(card => this._resizeObserver.observe(card));
    }

    _syncRingPosition() {
        const stack = this.renderRoot.querySelector('.plan-stack');
        const ring = this.renderRoot.querySelector('.plan-ring');
        const card = this.renderRoot.querySelector(`.plan-card.selected`);
        if (!stack || !ring || !card) return;

        const stackRect = stack.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        ring.style.transform = 'none';
        ring.style.top = `${cardRect.top - stackRect.top}px`;
        ring.style.height = `${cardRect.height}px`;
    }

    _handleSelect(sku) {
        this.selectedSku = sku;
        this.updateComplete.then(() => this._syncRingPosition());
        this.dispatchEvent(
            new CustomEvent('plan-select', {
                detail: { sku },
                bubbles: true,
                composed: true,
            })
        );
    }

    _handleCheckout() {
        if (this.busy || !this.selectedSku) return;
        this.dispatchEvent(
            new CustomEvent('checkout', {
                detail: { sku: this.selectedSku },
                bubbles: true,
                composed: true,
            })
        );
    }

    _selectedPlan() {
        return this.plans.find(plan => plan.sku === this.selectedSku) || this.plans[0];
    }

    render() {
        const selected = this._selectedPlan();

        return html`
            <div class="picker">
                <div class="plan-stack">
                    <div class="plan-ring" aria-hidden="true"></div>
                    ${this.plans.map(
                        plan => html`
                            <button
                                type="button"
                                class="plan-card ${plan.sku === this.selectedSku ? 'selected' : ''}"
                                ?disabled=${this.busy}
                                aria-pressed=${plan.sku === this.selectedSku}
                                @click=${() => this._handleSelect(plan.sku)}
                            >
                                <div class="plan-copy">
                                    <div class="plan-title-row">
                                        <span class="plan-name">${plan.name}</span>
                                        ${plan.popular ? html`<span class="plan-badge">Popular</span>` : ''}
                                    </div>
                                    <div class="plan-price-row">
                                        <span class="plan-price">$${plan.price}</span>
                                        <span class="plan-note">${plan.note}</span>
                                    </div>
                                </div>
                                <span class="plan-radio" aria-hidden="true">
                                    <span class="plan-radio-dot"></span>
                                </span>
                            </button>
                        `
                    )}
                </div>

                ${
                    selected?.highlights?.length
                        ? html`
                              <div class="highlights">
                                  ${selected.highlights.map(
                                      item => html`
                                          <div class="highlight">
                                              <span class="highlight-dot"></span>
                                              ${item}
                                          </div>
                                      `
                                  )}
                              </div>
                          `
                        : ''
                }

                <button type="button" class="checkout-cta" ?disabled=${this.busy} @click=${() => this._handleCheckout()}>
                    ${this.busy ? 'Opening checkout…' : `Checkout — ${selected?.name} · $${selected?.price}`}
                </button>
            </div>
        `;
    }
}

customElements.define('premium-plan-picker', PremiumPlanPicker);
