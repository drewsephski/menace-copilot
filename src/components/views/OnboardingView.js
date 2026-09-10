import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import '../ui/premiumPlanPicker.js';
import '../ui/premiumLicenseInput.js';
import { DEFAULT_SESSION_PROFILE_ID, getPickerProfiles, getSessionProfile } from '../../config/sessionProfiles.js';
import { clickableControlStyles } from './sharedPageStyles.js';

export class OnboardingView extends LitElement {
    static styles = [
        clickableControlStyles,
        css`
        * {
            font-family: var(--font);
            cursor: default;
            user-select: none;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :host {
            display: block;
            height: 100%;
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            overflow: hidden;
            color-scheme: dark;
        }

        .onboarding {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-x: hidden;
            overflow-y: auto;
            border-radius: var(--radius-hood);
            border: 1px solid var(--border);
            background: var(--bg-app);
            overscroll-behavior: contain;
        }

        .hood {
            position: absolute;
            inset: 0;
            background:
                radial-gradient(ellipse 80% 60% at 50% 40%, rgba(196, 30, 58, 0.08) 0%, transparent 55%),
                linear-gradient(180deg, #0b0b0b 0%, #101010 100%);
            z-index: 0;
        }

        .bezel {
            position: absolute;
            inset: 10px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            pointer-events: none;
            z-index: 1;
        }

        .slide {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            text-align: left;
            width: min(440px, calc(100% - 64px));
            margin-block: auto;
            flex-shrink: 0;
            padding: var(--space-xl) var(--space-lg);
            gap: var(--space-md);
        }

        .tally-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 4px;
        }

        .tally {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--tally-dim);
            box-shadow: inset 0 0 0 1px rgba(196, 30, 58, 0.35);
            transition:
                background 150ms ease,
                box-shadow 150ms ease;
        }

        .tally.lit {
            background: var(--tally);
            box-shadow: 0 0 12px var(--tally-glow);
        }

        .slide-title {
            font-size: var(--font-size-2xl);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            line-height: 1.15;
            letter-spacing: -0.02em;
        }

        .slide-text {
            font-size: var(--font-size-sm);
            line-height: var(--line-height);
            color: var(--text-secondary);
        }

        .edge-plates {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 4px;
        }

        .plate {
            border: 1px solid var(--border);
            background: var(--bg-surface);
            border-radius: var(--radius-sm);
            padding: 10px 12px;
        }

        .plate-name {
            font-size: 11px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-muted);
            font-weight: var(--font-weight-semibold);
            margin-bottom: 4px;
        }

        .plate-body {
            font-size: var(--font-size-sm);
            color: var(--text-primary);
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-label {
            font-size: 11px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-muted);
            font-weight: var(--font-weight-semibold);
        }

        .context-input,
        .key-input {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--bg-elevated);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
            font-family: var(--font);
            line-height: var(--line-height);
            text-align: left;
        }

        .context-input {
            min-height: 120px;
            resize: vertical;
        }

        .context-input::placeholder,
        .key-input::placeholder {
            color: var(--text-muted);
        }

        .context-input:focus,
        .key-input:focus {
            outline: none;
            border-color: var(--accent);
        }

        .key-input.error {
            border-color: var(--danger);
        }

        .form-hint {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            line-height: 1.4;
        }

        .form-hint.danger {
            color: var(--danger);
        }

        .checkout-error {
            color: var(--danger);
            font-size: var(--font-size-xs);
            line-height: 1.4;
        }

        .checklist {
            display: flex;
            flex-direction: column;
            gap: 8px;
            border: 1px solid var(--border);
            background: var(--bg-surface);
            border-radius: var(--radius-sm);
            padding: 12px;
        }

        .check-item {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            line-height: 1.4;
        }

        .check-mark {
            width: 8px;
            height: 8px;
            margin-top: 5px;
            border-radius: 50%;
            background: var(--tally-dim);
            flex-shrink: 0;
        }

        .plan-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .plan {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--bg-elevated);
            text-align: left;
            color: var(--text-primary);
            cursor: pointer;
        }

        .plan.hero {
            border-color: var(--tally-dim);
        }

        .plan-name {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
        }

        .plan-price {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
        }

        .plan-note {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }

        .profile-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .profile-row {
            display: flex;
            flex-direction: column;
            gap: 2px;
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--bg-elevated);
            text-align: left;
            cursor: pointer;
        }

        .profile-row.selected {
            border-color: var(--accent);
            background: var(--bg-surface);
        }

        .profile-row-label {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .profile-row-desc {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            line-height: 1.4;
        }

        .activate-row {
            display: flex;
            gap: 8px;
        }

        .activate-row .key-input {
            flex: 1;
            min-width: 0;
            font-family: var(--font-mono);
        }

        .status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border);
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            width: fit-content;
        }

        .status-pill.ready {
            border-color: rgba(90, 171, 110, 0.35);
            color: var(--success);
        }

        .actions {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            margin-top: 8px;
        }

        .btn-primary {
            box-sizing: border-box;
            width: 100%;
            background-color: #c41e3a;
            border: none;
            color: #f7f7f2;
            font-family: var(--font);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            padding: 12px 16px;
            border-radius: var(--radius-sm);
            cursor: pointer;
            letter-spacing: 0.02em;
            text-align: center;
            user-select: none;
            -webkit-user-select: none;
            transition: background-color 150ms ease;
        }

        .btn-primary:hover,
        .btn-primary:active {
            background-color: #a81830;
            color: #f7f7f2;
        }

        .btn-primary:focus {
            outline: none;
        }

        .btn-primary:focus-visible {
            outline: 2px solid #c41e3a;
            outline-offset: 2px;
        }

        .btn-primary:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        .btn-back,
        .btn-skip,
        .btn-ghost {
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: var(--font-size-sm);
            cursor: pointer;
            padding: 8px;
        }

        .btn-back:hover,
        .btn-skip:hover,
        .btn-ghost:hover {
            color: var(--text-secondary);
        }

        .step-dots {
            display: flex;
            gap: 6px;
            justify-content: center;
            margin-top: 4px;
        }

        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--border-strong);
        }

        .dot.active {
            background: var(--accent);
        }

        @media (max-width: 520px), (max-height: 560px) {
            .slide {
                width: min(440px, calc(100% - 32px));
                padding: var(--space-lg) var(--space-md);
            }

            .plan-row,
            .activate-row {
                grid-template-columns: 1fr;
                flex-direction: column;
            }
        }

        @media (max-width: 400px) {
            .edge-plates {
                grid-template-columns: 1fr;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .tally,
            .btn-primary {
                transition: none;
            }
        }
    `,
    ];

    static properties = {
        currentSlide: { type: Number },
        contextText: { type: String },
        licenseKey: { type: String },
        license: { type: Object },
        keyError: { type: Boolean },
        licenseError: { type: String },
        licenseBusy: { type: Boolean },
        checkoutBusy: { type: Boolean },
        checkoutError: { type: String },
        selectedSku: { type: String },
        selectedProfile: { type: String },
        onComplete: { type: Function },
        onExternalLink: { type: Function },
        onLicenseChanged: { type: Function },
    };

    constructor() {
        super();
        this.currentSlide = 0;
        this.contextText = '';
        this.licenseKey = '';
        this.license = { valid: false, status: 'missing' };
        this.keyError = false;
        this.licenseError = '';
        this.licenseBusy = false;
        this.checkoutBusy = false;
        this.checkoutError = '';
        this.selectedSku = 'search_pass';
        this.selectedProfile = DEFAULT_SESSION_PROFILE_ID;
        this.onComplete = () => {};
        this.onExternalLink = () => {};
        this.onLicenseChanged = () => {};
    }

    async connectedCallback() {
        super.connectedCallback();
        await this._refreshLicense();
    }

    async _refreshLicense() {
        this.license = await cheatingDaddy.license.getStatus();
        if (this.license?.valid && this.currentSlide === 1) {
            this.licenseError = '';
        }
        this.requestUpdate();
    }

    handleContextInput(e) {
        this.contextText = e.target.value;
    }

    handleLicenseKeyInput(e) {
        this.licenseKey = e.target.value;
        this.licenseError = '';
    }

    _handleGoKey(e, action) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    }

    async _openCheckout(sku) {
        this.checkoutError = '';
        this.licenseError = '';
        this.checkoutBusy = true;
        const result = await cheatingDaddy.license.openCheckout(sku || this.selectedSku);
        this.checkoutBusy = false;
        if (!result.success) {
            this.checkoutError = result.error || 'Could not open checkout.';
        }
        this.requestUpdate();
    }

    _handlePlanSelect(event) {
        this.selectedSku = event.detail.sku;
        this.checkoutError = '';
    }

    _handleLicenseKeyChange(event) {
        this.licenseKey = event.detail.value;
        this.licenseError = '';
    }

    async _openPortal() {
        this.checkoutError = '';
        const result = await cheatingDaddy.license.openPortal();
        if (!result.success) {
            this.checkoutError = result.error || 'Could not open Polar portal.';
            this.requestUpdate();
        }
    }

    async _activateLicense() {
        if (this.licenseBusy) return;
        this.licenseBusy = true;
        this.licenseError = '';

        const result = await cheatingDaddy.license.activate(this.licenseKey);
        this.licenseBusy = false;

        if (!result.success) {
            this.licenseError = result.error || 'Could not activate that key.';
            this.requestUpdate();
            return;
        }

        this.licenseKey = '';
        this.license = result.status;
        this.onLicenseChanged(result.status);
        this.requestUpdate();
    }

    _continueFromLicense() {
        if (!this.license?.valid) {
            this.licenseError = 'Choose a pass or paste your MENACE key to continue.';
            this.requestUpdate();
            return;
        }

        this.currentSlide = 2;
    }

    async completeOnboarding() {
        if (this.contextText.trim()) {
            await cheatingDaddy.storage.setProfileContext(this.selectedProfile, this.contextText.trim());
        }

        await cheatingDaddy.storage.updatePreference('selectedProfile', this.selectedProfile);
        await cheatingDaddy.storage.updatePreference('providerMode', 'whisper_openrouter');
        await cheatingDaddy.storage.updatePreference('whisperModel', 'base.en');
        await cheatingDaddy.storage.updateConfig('onboarded', true);
        this.onComplete();
    }

    _renderDots() {
        return html`
            <div class="step-dots" aria-hidden="true">
                ${[0, 1, 2, 3].map(i => html`<span class="dot ${i === this.currentSlide ? 'active' : ''}"></span>`)}
            </div>
        `;
    }

    renderSlide() {
        const dots = this._renderDots();

        if (this.currentSlide === 0) {
            return html`
                <div class="slide">
                    <div class="tally-row"><span class="tally"></span></div>
                    <div class="slide-title">Your real-time copilot for live conversations.</div>
                    <div class="slide-text">
                        Menace listens to the conversation, understands what&rsquo;s on screen, and gives you concise, ready-to-say responses in real time.
                        AI answers are included with your pass — no API keys required.
                    </div>
                    <div class="form-label">What will you use Menace for first?</div>
                    <div class="profile-list">
                        ${getPickerProfiles().map(
                            profile => html`
                                <button
                                    type="button"
                                    class="profile-row ${this.selectedProfile === profile.id ? 'selected' : ''}"
                                    @click=${() => {
                                        this.selectedProfile = profile.id;
                                    }}
                                >
                                    <span class="profile-row-label">${profile.label}</span>
                                    <span class="profile-row-desc">${profile.description}</span>
                                </button>
                            `
                        )}
                    </div>
                    <div class="edge-plates">
                        <div class="plate">
                            <div class="plate-name">Listen</div>
                            <div class="plate-body">Local Whisper</div>
                        </div>
                        <div class="plate">
                            <div class="plate-name">Answer</div>
                            <div class="plate-body">Included AI</div>
                        </div>
                    </div>
                    <div class="actions">
                        <div
                            class="btn-primary"
                            role="button"
                            tabindex="0"
                            @click=${() => {
                                this.currentSlide = 1;
                            }}
                            @keydown=${e =>
                                this._handleGoKey(e, () => {
                                    this.currentSlide = 1;
                                })}
                        >
                            Continue
                        </div>
                        ${dots}
                    </div>
                </div>
            `;
        }

        if (this.currentSlide === 1) {
            const activated = Boolean(this.license?.valid);

            return html`
                <div class="slide">
                    <div class="tally-row"><span class="tally lit"></span></div>
                    <div class="slide-title">${activated ? 'Pass activated' : 'Unlock your pass'}</div>
                    <div class="slide-text">
                        ${
                            activated
                                ? 'AI answers are ready on this Mac. Continue to grant permissions and start your first session.'
                                : 'Checkout opens in your browser. Your MENACE key is in Polar’s customer portal or confirmation email.'
                        }
                    </div>

                    <span class="status-pill ${activated ? 'ready' : ''}">${activated ? 'Ready' : 'Required'}</span>

                    ${
                        activated
                            ? ''
                            : html`
                                  <premium-plan-picker
                                      selected-sku=${this.selectedSku}
                                      ?busy=${this.checkoutBusy}
                                      @plan-select=${this._handlePlanSelect}
                                      @checkout=${event => this._openCheckout(event.detail.sku)}
                                  ></premium-plan-picker>
                                  ${this.checkoutError ? html`<div class="checkout-error">${this.checkoutError}</div>` : ''}

                                  <button class="btn-ghost" style="margin-bottom: 12px;" @click=${() => this._openPortal()}>
                                      Open Polar customer portal
                                  </button>

                                  <premium-license-input
                                      .value=${this.licenseKey}
                                      ?busy=${this.licenseBusy}
                                      .error=${this.licenseError}
                                      hint=${
                                          this.license?.sandbox
                                              ? 'Sandbox checkout: use card 4242 4242 4242 4242.'
                                              : 'Already paid? Paste your key, then activate.'
                                      }
                                      @value-change=${this._handleLicenseKeyChange}
                                      @activate=${() => this._activateLicense()}
                                  ></premium-license-input>
                              `
                    }

                    <div class="actions">
                        <div
                            class="btn-primary"
                            role="button"
                            tabindex="0"
                            @click=${() => this._continueFromLicense()}
                            @keydown=${e => this._handleGoKey(e, () => this._continueFromLicense())}
                        >
                            Continue
                        </div>
                        ${activated ? '' : html`<button class="btn-ghost" @click=${() => this._refreshLicense()}>Refresh after checkout</button>`}
                        <button
                            class="btn-back"
                            @click=${() => {
                                this.currentSlide = 0;
                            }}
                        >
                            Back
                        </button>
                        ${dots}
                    </div>
                </div>
            `;
        }

        if (this.currentSlide === 2) {
            return html`
                <div class="slide">
                    <div class="tally-row"><span class="tally lit"></span></div>
                    <div class="slide-title">Let it hear the room</div>
                    <div class="slide-text">
                        macOS will ask for Screen & System Audio Recording. Enable Menace Agent there so it can hear the conversation from your
                        speakers or headset.
                    </div>
                    <div class="checklist">
                        <div class="check-item">
                            <span class="check-mark"></span>
                            <span>System Settings → Privacy & Security → Screen & System Audio Recording</span>
                        </div>
                        <div class="check-item">
                            <span class="check-mark"></span>
                            <span>On macOS 26+, also check System Audio Recording Only if capture stays silent</span>
                        </div>
                        <div class="check-item">
                            <span class="check-mark"></span>
                            <span>Whisper downloads automatically the first time you start a session</span>
                        </div>
                    </div>
                    <div class="actions">
                        <div
                            class="btn-primary"
                            role="button"
                            tabindex="0"
                            @click=${() => {
                                this.onExternalLink('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
                                this.currentSlide = 3;
                            }}
                            @keydown=${e =>
                                this._handleGoKey(e, () => {
                                    this.onExternalLink('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
                                    this.currentSlide = 3;
                                })}
                        >
                            Open Privacy Settings
                        </div>
                        <button
                            class="btn-skip"
                            @click=${() => {
                                this.currentSlide = 3;
                            }}
                        >
                            I'll do this later
                        </button>
                        <button
                            class="btn-back"
                            @click=${() => {
                                this.currentSlide = 1;
                            }}
                        >
                            Back
                        </button>
                        ${dots}
                    </div>
                </div>
            `;
        }

        const profile = getSessionProfile(this.selectedProfile);

        return html`
            <div class="slide">
                <div class="tally-row"><span class="tally lit"></span></div>
                <div class="slide-title">Prepare your session</div>
                <div class="slide-text">${profile.contextLabel} Skip if you want to add this later on Home.</div>
                <textarea
                    class="context-input"
                    placeholder=${profile.contextPlaceholder}
                    .value=${this.contextText}
                    @input=${this.handleContextInput}
                    aria-label="Session context"
                ></textarea>
                <div class="actions">
                    <div
                        class="btn-primary"
                        role="button"
                        tabindex="0"
                        @click=${this.completeOnboarding}
                        @keydown=${e => this._handleGoKey(e, () => this.completeOnboarding())}
                    >
                        Go to Home
                    </div>
                    <button class="btn-skip" @click=${this.completeOnboarding}>Skip for now</button>
                    <button
                        class="btn-back"
                        @click=${() => {
                            this.currentSlide = 2;
                        }}
                    >
                        Back
                    </button>
                    ${dots}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="onboarding">
                <div class="hood"></div>
                <div class="bezel"></div>
                ${this.renderSlide()}
            </div>
        `;
    }
}

customElements.define('onboarding-view', OnboardingView);
