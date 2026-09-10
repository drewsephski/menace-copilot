import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { clickableControlStyles, unifiedPageStyles } from './sharedPageStyles.js';
import '../ui/uiSelect.js';
import '../ui/uiButton.js';
import '../ui/uiConfirmDialog.js';

export class CustomizeView extends LitElement {
    static styles = [
        clickableControlStyles,
        unifiedPageStyles,
        css`
            .privacy-callout {
                padding: var(--space-sm) var(--space-md);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--bg-elevated);
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
                line-height: 1.5;
            }

            .slider-wrap {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: var(--space-xs);
            }

            .slider-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--space-sm);
            }

            .slider-value {
                font-family: var(--font-mono);
                font-size: var(--font-size-xs);
                color: var(--text-secondary);
                background: var(--bg-elevated);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 2px 8px;
            }

            .slider-input {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 4px;
                border-radius: var(--radius-sm);
                background: var(--border);
                outline: none;
                cursor: pointer;
            }

            .slider-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--text-primary);
                border: none;
            }

            .slider-input::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--text-primary);
                border: none;
            }

            .danger-surface {
                border-color: var(--danger);
            }

            .status {
                margin-top: var(--space-sm);
                padding: var(--space-sm);
                border-radius: var(--radius-sm);
                border: 1px solid var(--border);
                font-size: var(--font-size-xs);
            }

            .status.success {
                border-color: var(--success);
                color: var(--success);
            }

            .status.error {
                border-color: var(--danger);
                color: var(--danger);
            }
        `,
    ];

    static properties = {
        selectedLanguage: { type: String },
        onLanguageChange: { type: Function },
        onImageQualityChange: { type: Function },
        isClearing: { type: Boolean },
        isRestoring: { type: Boolean },
        clearStatusMessage: { type: String },
        clearStatusType: { type: String },
        deleteDataConfirmOpen: { type: Boolean },
        windowLayer: { type: String },
        backgroundTransparency: { type: Number },
        fontSize: { type: Number },
        theme: { type: String },
    };

    constructor() {
        super();
        this.selectedLanguage = 'en-US';
        this.onLanguageChange = () => {};
        this.onImageQualityChange = () => {};
        this.windowLayer = 'overlay';
        this.backgroundTransparency = 0.8;
        this.fontSize = 20;
        this.theme = 'dark';
        this.isClearing = false;
        this.isRestoring = false;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.deleteDataConfirmOpen = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadFromStorage();
    }

    _app() {
        return window.cheatingDaddy;
    }

    getThemes() {
        const app = this._app();
        if (!app?.theme?.getAll) {
            return [{ value: 'dark', label: 'Autocue' }];
        }

        return app.theme.getAll().map(theme => ({
            value: theme.value,
            label: theme.name,
        }));
    }

    async _loadFromStorage() {
        const app = this._app();
        if (!app?.storage) {
            return;
        }

        try {
            const prefs = await app.storage.getPreferences();
            this.selectedLanguage = prefs.selectedLanguage || 'en-US';
            this.windowLayer = prefs.windowLayer === 'normal' ? 'normal' : 'overlay';
            this.backgroundTransparency = prefs.backgroundTransparency ?? 0.8;
            this.fontSize = prefs.fontSize ?? 20;
            this.theme = prefs.theme ?? 'dark';
            this.updateBackgroundAppearance();
            this.updateFontSize();
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    getLanguages() {
        return [
            { value: 'en-US', label: 'English (US)' },
            { value: 'en-GB', label: 'English (UK)' },
            { value: 'en-AU', label: 'English (Australia)' },
            { value: 'de-DE', label: 'German (Germany)' },
            { value: 'es-US', label: 'Spanish (US)' },
            { value: 'es-ES', label: 'Spanish (Spain)' },
            { value: 'fr-FR', label: 'French (France)' },
            { value: 'fr-CA', label: 'French (Canada)' },
            { value: 'hi-IN', label: 'Hindi (India)' },
            { value: 'pt-BR', label: 'Portuguese (Brazil)' },
            { value: 'ja-JP', label: 'Japanese (Japan)' },
            { value: 'ko-KR', label: 'Korean (South Korea)' },
            { value: 'cmn-CN', label: 'Mandarin Chinese (China)' },
        ];
    }

    _selectValue(event) {
        return event.detail?.value ?? event.target.value;
    }

    handleLanguageSelect(e) {
        this.selectedLanguage = this._selectValue(e);
        this.onLanguageChange(this.selectedLanguage);
    }

    async handleWindowLayerSelect(e) {
        this.windowLayer = this._selectValue(e);
        await this._app().storage.updatePreference('windowLayer', this.windowLayer);
        this.requestUpdate();
    }

    async handleThemeChange(e) {
        this.theme = this._selectValue(e);
        await this._app().theme.save(this.theme);
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    async handleBackgroundTransparencyChange(e) {
        this.backgroundTransparency = parseFloat(e.target.value);
        await this._app().storage.updatePreference('backgroundTransparency', this.backgroundTransparency);
        this.updateBackgroundAppearance();
        this.requestUpdate();
    }

    updateBackgroundAppearance() {
        const app = this._app();
        if (!app?.theme) {
            return;
        }

        const colors = app.theme.get(this.theme);
        app.theme.applyBackgrounds(colors.background, this.backgroundTransparency);
    }

    async handleFontSizeChange(e) {
        this.fontSize = parseInt(e.target.value, 10);
        await this._app().storage.updatePreference('fontSize', this.fontSize);
        this.updateFontSize();
        this.requestUpdate();
    }

    updateFontSize() {
        document.documentElement.style.setProperty('--response-font-size', `${this.fontSize}px`);
    }

    async restoreAllSettings() {
        if (this.isRestoring) return;
        this.isRestoring = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();

        const app = this._app();
        if (!app?.storage) {
            return;
        }

        try {
            const defaults = {
                selectedLanguage: 'en-US',
                fontSize: 20,
                backgroundTransparency: 0.8,
                theme: 'dark',
                windowLayer: 'overlay',
            };

            for (const [key, value] of Object.entries(defaults)) {
                await app.storage.updatePreference(key, value);
            }

            this.selectedLanguage = defaults.selectedLanguage;
            this.windowLayer = defaults.windowLayer;
            this.fontSize = defaults.fontSize;
            this.backgroundTransparency = defaults.backgroundTransparency;
            this.theme = defaults.theme;

            this.onLanguageChange(defaults.selectedLanguage);
            this.updateBackgroundAppearance();
            this.updateFontSize();
            await app.theme.save(defaults.theme);

            this.clearStatusMessage = 'Settings restored to defaults';
            this.clearStatusType = 'success';
        } catch (error) {
            console.error('Error restoring settings:', error);
            this.clearStatusMessage = `Error restoring settings: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isRestoring = false;
            this.requestUpdate();
        }
    }

    openDeleteDataConfirm() {
        if (this.isClearing) {
            return;
        }
        this.deleteDataConfirmOpen = true;
        this.requestUpdate();
    }

    closeDeleteDataConfirm() {
        if (this.isClearing) {
            return;
        }
        this.deleteDataConfirmOpen = false;
        this.requestUpdate();
    }

    async clearLocalData() {
        if (this.isClearing) return;
        this.isClearing = true;
        this.clearStatusMessage = '';
        this.clearStatusType = '';
        this.requestUpdate();

        const app = this._app();
        if (!app?.storage) {
            return;
        }

        try {
            await app.storage.clearAll();
            this.deleteDataConfirmOpen = false;
            this.clearStatusMessage = 'All local data cleared';
            this.clearStatusType = 'success';
            this.requestUpdate();
            setTimeout(() => {
                this.clearStatusMessage = 'Closing application...';
                this.requestUpdate();
                setTimeout(async () => {
                    if (window.menace) {
                        await window.menace.app.quit();
                    }
                }, 1000);
            }, 2000);
        } catch (error) {
            console.error('Error clearing data:', error);
            this.clearStatusMessage = `Error clearing data: ${error.message}`;
            this.clearStatusType = 'error';
        } finally {
            this.isClearing = false;
            this.requestUpdate();
        }
    }

    render() {
        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div class="page-title">Settings</div>
                    <div class="page-subtitle">Window behavior, appearance, and local data.</div>

                    <section class="surface">
                        <div class="surface-title">Window</div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Window behavior</label>
                                <ui-select
                                    .value=${this.windowLayer}
                                    .options=${[
                                        { value: 'overlay', label: 'Stay on top (overlay)' },
                                        { value: 'normal', label: 'Hide behind other apps' },
                                    ]}
                                    @change=${this.handleWindowLayerSelect}
                                ></ui-select>
                            </div>
                            <div class="privacy-callout">
                                Menace Agent is invisible to screen sharing, screen recordings, and meeting software — other participants cannot see
                                it. Use overlay mode during calls so answers stay above your meeting window.
                            </div>
                        </div>
                    </section>

                    <section class="surface">
                        <div class="surface-title">Appearance</div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Theme</label>
                                <ui-select .value=${this.theme} .options=${this.getThemes()} @change=${this.handleThemeChange}></ui-select>
                            </div>
                            <div class="form-group slider-wrap vertical">
                                <div class="slider-header">
                                    <label class="form-label">Background transparency</label>
                                    <span class="slider-value">${Math.round(this.backgroundTransparency * 100)}%</span>
                                </div>
                                <input
                                    class="slider-input"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    .value=${this.backgroundTransparency}
                                    @input=${this.handleBackgroundTransparencyChange}
                                />
                            </div>
                            <div class="form-group slider-wrap vertical">
                                <div class="slider-header">
                                    <label class="form-label">Response font size</label>
                                    <span class="slider-value">${this.fontSize}px</span>
                                </div>
                                <input
                                    class="slider-input"
                                    type="range"
                                    min="12"
                                    max="32"
                                    step="1"
                                    .value=${this.fontSize}
                                    @input=${this.handleFontSizeChange}
                                />
                            </div>
                        </div>
                    </section>

                    <section class="surface">
                        <div class="surface-title">Language</div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Speech language</label>
                                <ui-select
                                    .value=${this.selectedLanguage}
                                    .options=${this.getLanguages()}
                                    @change=${this.handleLanguageSelect}
                                ></ui-select>
                            </div>
                        </div>
                    </section>

                    <section class="surface danger-surface">
                        <div class="surface-title danger">Data</div>
                        <div class="form-help" style="margin-bottom: var(--space-sm);">Keyboard shortcuts are listed on the Help page.</div>
                        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
                            <ui-button variant="destructive" ?loading=${this.isRestoring} @ui-click=${this.restoreAllSettings}>
                                ${this.isRestoring ? 'Restoring…' : 'Restore defaults'}
                            </ui-button>
                            <ui-button variant="destructive" @ui-click=${this.openDeleteDataConfirm}>Delete all data</ui-button>
                        </div>
                        ${
                            this.clearStatusMessage
                                ? html`
                                      <div class="status ${this.clearStatusType === 'success' ? 'success' : 'error'}">${this.clearStatusMessage}</div>
                                  `
                                : ''
                        }
                    </section>

                    <ui-confirm-dialog
                        ?open=${this.deleteDataConfirmOpen}
                        title="Delete all local data?"
                        description="This permanently removes sessions, settings, personal context, and your license from this Mac. The app will close afterward."
                        confirm-label="Delete all data"
                        cancel-label="Cancel"
                        tone="delete"
                        ?loading=${this.isClearing}
                        loading-label="Deleting…"
                        @confirm=${this.clearLocalData}
                        @cancel=${this.closeDeleteDataConfirm}
                    ></ui-confirm-dialog>
                </div>
            </div>
        `;
    }
}

customElements.define('customize-view', CustomizeView);
