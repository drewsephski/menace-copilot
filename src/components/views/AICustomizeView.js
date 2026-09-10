import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { clickableControlStyles, unifiedPageStyles } from './sharedPageStyles.js';
import { getPickerProfiles, getSessionProfile, normalizeProfileId } from '../../config/sessionProfiles.js';
import '../ui/uiSelect.js';
import './PersonalContextPanel.js';

export class AICustomizeView extends LitElement {
    static styles = [
        clickableControlStyles,
        unifiedPageStyles,
        css`
            .unified-page {
                height: 100%;
            }
            .unified-wrap {
                height: 100%;
            }
            section.surface {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .form-grid {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .form-group.vertical {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            textarea.control {
                flex: 1;
                resize: none;
                overflow-y: auto;
                min-height: 0;
            }
        `,
    ];

    static properties = {
        selectedProfile: { type: String },
        onProfileChange: { type: Function },
        _context: { state: true },
    };

    constructor() {
        super();
        this.selectedProfile = 'sales';
        this.onProfileChange = () => {};
        this._context = '';
        this._loadFromStorage();
    }

    async _loadContextForProfile(profileId) {
        try {
            this._context = await cheatingDaddy.storage.getProfileContext(profileId);
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading session context:', error);
        }
    }

    async _loadFromStorage() {
        try {
            const prefs = await cheatingDaddy.storage.getPreferences();
            const storedProfile = normalizeProfileId(prefs.selectedProfile);
            if (storedProfile !== this.selectedProfile) {
                this.onProfileChange(storedProfile);
            }
            await this._loadContextForProfile(storedProfile);
        } catch (error) {
            console.error('Error loading session context:', error);
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('selectedProfile')) {
            this._loadContextForProfile(this.selectedProfile);
        }
    }

    async _handleProfileChange(e) {
        const nextProfile = e.detail?.value ?? e.target.value;
        await cheatingDaddy.storage.setProfileContext(this.selectedProfile, this._context);
        this.onProfileChange(nextProfile);
    }

    async _saveContext(val) {
        this._context = val;
        await cheatingDaddy.storage.setProfileContext(this.selectedProfile, val);
    }

    render() {
        const profiles = getPickerProfiles();
        const profile = getSessionProfile(this.selectedProfile);

        return html`
            <div class="unified-page">
                <div class="unified-wrap">
                    <div>
                        <div class="page-title">Session Context</div>
                        <div class="page-subtitle">Background and instructions for each conversation type.</div>
                    </div>

                    <personal-context-panel></personal-context-panel>

                    <section class="surface">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Session type</label>
                                <ui-select
                                    .value=${this.selectedProfile}
                                    .options=${profiles.map(p => ({ value: p.id, label: p.label }))}
                                    @change=${this._handleProfileChange}
                                ></ui-select>
                            </div>
                            <div class="form-group vertical">
                                <label class="form-label">${profile.contextLabel}</label>
                                <textarea
                                    class="control"
                                    placeholder=${profile.contextPlaceholder}
                                    .value=${this._context}
                                    @input=${e => this._saveContext(e.target.value)}
                                ></textarea>
                                <div class="form-help">Saved per session type. Sent when you start a live session.</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }
}

customElements.define('ai-customize-view', AICustomizeView);
