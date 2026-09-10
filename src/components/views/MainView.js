import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { getPickerProfiles, getSessionProfile, normalizeProfileId } from '../../config/sessionProfiles.js';
import { clickableControlStyles } from './sharedPageStyles.js';
import '../ui/uiSelect.js';

const WHISPER_MODEL_OPTIONS = [
    { value: 'tiny.en', label: 'Fastest' },
    { value: 'base.en', label: 'Balanced (recommended)' },
    { value: 'small.en', label: 'Most accurate' },
];

const WHISPER_MODEL_OPTIONS_LOCAL = [
    { value: 'tiny.en', label: 'Fastest' },
    { value: 'base.en', label: 'Balanced' },
    { value: 'small.en', label: 'Most accurate' },
];

function normalizeProviderMode(mode) {
    if (mode === 'cloud') {
        return 'byok';
    }
    if (mode === 'byok' || mode === 'local' || mode === 'whisper_openrouter') {
        return mode;
    }
    return 'whisper_openrouter';
}

export class MainView extends LitElement {
    static styles = [
        clickableControlStyles,
        css`
        * {
            font-family: var(--font);
            cursor: default;
            user-select: none;
            box-sizing: border-box;
        }

        :host {
            display: block;
            height: 100%;
            min-height: 0;
            color-scheme: dark;
        }

        .form-scroll {
            height: 100%;
            min-height: 0;
            overflow-x: hidden;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: var(--space-xl) var(--space-lg);
            overscroll-behavior: contain;
        }

        .form-wrapper {
            width: 100%;
            max-width: 420px;
            margin-block: auto;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
        }

        .form-scroll::-webkit-scrollbar {
            width: 6px;
        }

        .form-scroll::-webkit-scrollbar-thumb {
            background: var(--border-strong);
            border-radius: 3px;
        }

        .page-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            margin-bottom: var(--space-xs);
        }

        .page-title .mode-suffix {
            opacity: 0.5;
        }

        .page-subtitle {
            font-size: var(--font-size-sm);
            color: var(--text-muted);
            margin-bottom: var(--space-md);
        }

        /* ── Form controls ── */

        .form-group {
            display: flex;
            flex-direction: column;
            gap: var(--space-xs);
            min-width: 0;
        }

        ui-select {
            width: 100%;
            --ui-select-width: 100%;
        }

        .config-section {
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-surface);
            overflow: visible;
        }

        .config-summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
            padding: 12px 14px;
            min-height: 44px;
            cursor: pointer;
            list-style: none;
        }

        .config-summary:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: -2px;
        }

        .config-summary::-webkit-details-marker {
            display: none;
        }

        .config-summary-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .config-summary-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
        }

        .config-summary-description {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }

        .config-chevron {
            width: 16px;
            height: 16px;
            color: var(--text-muted);
            transition: transform var(--transition);
        }

        .config-section[open] .config-chevron {
            transform: rotate(180deg);
        }

        .config-content {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
            padding: 14px;
            border-top: 1px solid var(--border);
        }

        .config-note {
            padding: 10px 12px;
            border: 1px solid rgba(212, 160, 23, 0.28);
            border-radius: var(--radius-sm);
            background: rgba(212, 160, 23, 0.08);
            color: var(--text-secondary);
            font-size: var(--font-size-xs);
            line-height: var(--line-height);
        }

        .included-banner {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px;
            border: 1px solid rgba(90, 171, 110, 0.35);
            border-radius: var(--radius-md);
            background: var(--bg-surface);
        }

        .profile-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .profile-row {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--bg-elevated);
            text-align: left;
            cursor: pointer;
            transition:
                border-color var(--transition),
                background var(--transition);
        }

        .profile-row:hover {
            border-color: var(--border-strong);
            background: var(--bg-hover);
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
            line-height: var(--line-height);
        }

        .context-area {
            min-height: 96px;
        }

        .included-banner-icon {
            flex: none;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(90, 171, 110, 0.16);
            color: var(--success);
        }

        .included-banner-icon svg {
            width: 16px;
            height: 16px;
        }

        .included-banner-copy {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }

        .included-banner-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .included-banner-text {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            line-height: var(--line-height);
        }

        .unlock-card {
            display: flex;
            flex-direction: column;
            gap: var(--space-sm);
            padding: 14px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-surface);
        }

        .unlock-card-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .unlock-card-text {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            line-height: var(--line-height);
        }

        .unlock-card-button {
            align-self: flex-start;
            border: none;
            border-radius: var(--radius-sm);
            padding: 8px 12px;
            background: var(--accent);
            color: #f7f7f2;
            font-family: var(--font);
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            cursor: pointer;
            transition: background-color var(--transition);
        }

        .unlock-card-button:hover {
            background: var(--accent-hover);
        }

        .api-key-divider {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            color: var(--text-muted);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .api-key-divider::before,
        .api-key-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        .form-label {
            font-size: 11px;
            font-weight: var(--font-weight-semibold);
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        input,
        select,
        textarea {
            background: var(--bg-elevated);
            color: var(--text-primary);
            border: 1px solid var(--border);
            padding: 10px 12px;
            width: 100%;
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-family: var(--font);
            transition:
                border-color var(--transition),
                box-shadow var(--transition);
        }

        input:hover:not(:focus),
        select:hover:not(:focus),
        textarea:hover:not(:focus) {
            border-color: var(--border-strong);
        }

        input:focus,
        select:focus,
        textarea:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--accent);
        }

        input::placeholder,
        textarea::placeholder {
            color: var(--text-muted);
        }

        input.error {
            border-color: var(--danger, #c41e3a);
        }

        select {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 8px center;
            background-repeat: no-repeat;
            background-size: 14px;
            padding-right: 28px;
        }

        optgroup {
            font-family: var(--font);
            font-weight: var(--font-weight-semibold);
            color: var(--text-muted);
        }

        textarea {
            resize: vertical;
            min-height: 80px;
            line-height: var(--line-height);
        }

        .form-hint {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }

        .form-hint a,
        .form-hint span.link {
            color: var(--accent);
            text-decoration: none;
            cursor: pointer;
        }

        .form-hint span.link:hover {
            text-decoration: underline;
        }

        .whisper-label-row {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .whisper-spinner {
            width: 12px;
            height: 12px;
            border: 2px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: whisper-spin 0.8s linear infinite;
        }

        @keyframes whisper-spin {
            to {
                transform: rotate(360deg);
            }
        }

        /* ── Start control — not a native <button>; macOS paints those white on hover ── */

        .start-button {
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-sm);
            padding: 12px 16px;
            border: none;
            border-radius: var(--radius-sm);
            background-color: #c41e3a;
            color: #f7f7f2;
            font-family: var(--font);
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            line-height: 1.3;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            -webkit-app-region: no-drag;
            transition: background-color 150ms ease;
        }

        .start-error {
            margin-top: var(--space-xs);
            font-size: var(--font-size-xs);
            color: var(--danger, #c41e3a);
            line-height: var(--line-height);
        }

        .start-button .btn-label {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            color: #f7f7f2;
        }

        .start-button:hover,
        .start-button:active {
            background-color: #a81830;
            color: #f7f7f2;
        }

        .start-button:hover .btn-label,
        .start-button:active .btn-label {
            color: #f7f7f2;
        }

        .start-button:focus {
            outline: none;
        }

        .start-button:focus-visible {
            outline: 2px solid #c41e3a;
            outline-offset: 2px;
        }

        .start-button.disabled,
        .start-button.disabled:hover,
        .start-button.disabled:active {
            background-color: #c41e3a;
            color: #f7f7f2;
            opacity: 0.45;
            cursor: not-allowed;
            pointer-events: none;
        }

        .download-progress-fill {
            position: absolute;
            inset: 0;
            z-index: 2;
            width: 100%;
            transform: scaleX(0);
            transform-origin: left center;
            background: rgba(247, 247, 242, 0.18);
            transition: transform 0.2s ease;
            pointer-events: none;
        }

        .download-progress-fill.indeterminate {
            width: 38%;
            transform: none;
            animation: download-progress-slide 1.2s ease-in-out infinite;
        }

        .download-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
            margin-top: var(--space-xs);
            font-size: var(--font-size-xs);
            color: var(--text-muted);
        }

        .download-cancel {
            flex: none;
            padding: 0;
            border: none;
            background: none;
            color: var(--danger, #c41e3a);
            font: inherit;
            cursor: pointer;
        }

        .download-cancel:hover {
            text-decoration: underline;
        }

        @keyframes download-progress-slide {
            from {
                transform: translateX(-105%);
            }
            to {
                transform: translateX(270%);
            }
        }

        .shortcut-hint {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            opacity: 0.5;
            font-family: var(--font-mono);
        }

        /* ── Divider ── */

        .divider {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            margin: var(--space-sm) 0;
        }

        .divider-line {
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        .divider-text {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            text-transform: lowercase;
        }

        /* ── Mode switch links ── */

        .mode-links {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: var(--space-sm) var(--space-lg);
        }

        .mode-link {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            cursor: pointer;
            background: none;
            border: none;
            padding: 0;
            transition: color var(--transition);
        }

        .mode-link:hover {
            color: var(--text-primary);
        }

        /* ── Mode option cards ── */

        .mode-cards {
            display: flex;
            gap: var(--space-sm);
        }

        .mode-card {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px 14px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            background: var(--bg-elevated);
            cursor: pointer;
            transition:
                border-color 0.2s,
                background 0.2s;
        }

        .mode-card:hover {
            border-color: var(--text-muted);
            background: var(--bg-hover);
        }

        .mode-card-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .mode-card-desc {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            line-height: var(--line-height);
        }

        /* ── Title row with help ── */

        .title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--space-xs);
        }

        .title-row .page-title {
            margin-bottom: 0;
        }

        .help-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            border-radius: var(--radius-sm);
            transition: color 0.2s;
            display: flex;
            align-items: center;
        }

        .help-btn:hover {
            color: var(--text-secondary);
        }

        .help-btn * {
            pointer-events: none;
        }

        .help-dialog-backdrop {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-lg);
            background: rgba(11, 11, 11, 0.72);
        }

        .help-dialog {
            width: min(680px, 100%);
            max-height: calc(100vh - 48px);
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
            padding: var(--space-lg);
            overflow: hidden;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            color: var(--text-primary);
        }

        .help-dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
        }

        .help-dialog-title {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
        }

        /* ── Help content ── */

        .help-content {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
            overflow-y: auto;
        }

        .help-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .help-section-title {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .help-section-text {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            line-height: var(--line-height);
        }

        .help-code {
            font-family: var(--font-mono);
            font-size: 11px;
            background: var(--bg-hover);
            padding: 6px 8px;
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            display: block;
        }

        .help-link {
            color: var(--accent);
            cursor: pointer;
            text-decoration: none;
        }

        .help-link:hover {
            text-decoration: underline;
        }

        .help-divider {
            border: none;
            border-top: 1px solid var(--border);
            margin: 0;
        }

        .help-cloud-btn {
            background: #f7f7f2;
            color: #0b0b0b;
            border: none;
            padding: 10px var(--space-md);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-family: var(--font);
            font-weight: var(--font-weight-semibold);
            cursor: pointer;
            width: 100%;
            transition: opacity 0.15s;
        }

        .help-cloud-btn:hover {
            opacity: 0.9;
        }

        .help-warn {
            font-size: var(--font-size-xs);
            color: var(--warning);
            line-height: var(--line-height);
        }

        @media (max-width: 720px), (max-height: 640px) {
            .form-scroll {
                padding: var(--space-md);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .config-chevron,
            .start-button,
            input,
            select,
            textarea {
                transition: none;
            }
        }
    `,
    ];

    static properties = {
        onStart: { type: Function },
        onExternalLink: { type: Function },
        selectedProfile: { type: String },
        onProfileChange: { type: Function },
        isInitializing: { type: Boolean },
        whisperDownloading: { type: Boolean },
        downloadProgress: { type: Object },
        onCancelDownload: { type: Function },
        licenseValid: { type: Boolean },
        requiresApiKeys: { type: Boolean },
        onUnlock: { type: Function },
        // Internal state
        _mode: { state: true },
        _token: { state: true },
        _geminiKey: { state: true },
        _openrouterKey: { state: true },
        _openaiKey: { state: true },
        _tokenError: { state: true },
        _keyError: { state: true },
        _whisperModel: { state: true },
        _showLocalHelp: { state: true },
        _profileContext: { state: true },
        _startError: { state: true },
        _advancedOpen: { state: true },
    };

    constructor() {
        super();
        this.onStart = () => {};
        this.onExternalLink = () => {};
        this.selectedProfile = 'sales';
        this.onProfileChange = () => {};
        this.isInitializing = false;
        this.whisperDownloading = false;
        this.downloadProgress = { active: false, label: '', percentage: null };
        this.onCancelDownload = () => {};
        this.licenseValid = false;
        this.requiresApiKeys = false;
        this.onUnlock = () => {};

        this._mode = 'whisper_openrouter';
        this._token = '';
        this._geminiKey = '';
        this._openrouterKey = '';
        this._openaiKey = '';
        this._tokenError = false;
        this._keyError = false;
        this._showLocalHelp = false;
        this._whisperModel = 'base.en';
        this._profileContext = '';
        this._startError = '';
        this._advancedOpen = false;
        this._startErrorTimer = null;

        this._animId = null;
        this._time = 0;
        this._mouseX = -1;
        this._mouseY = -1;

        this.boundKeydownHandler = this._handleKeydown.bind(this);
        this._loadFromStorage();
    }

    async _loadFromStorage() {
        try {
            const [prefs, creds] = await Promise.all([
                cheatingDaddy.storage.getPreferences(),
                cheatingDaddy.storage.getCredentials().catch(() => ({})),
            ]);

            this._mode = normalizeProviderMode(prefs.providerMode);

            const storedProfile = normalizeProfileId(prefs.selectedProfile);
            if (storedProfile !== this.selectedProfile) {
                this.onProfileChange(storedProfile);
            }

            const keyStatus = await cheatingDaddy.storage.getKeyStatus().catch(() => ({
                hasGeminiKey: false,
                hasOpenRouterKey: false,
            }));

            this._token = creds.hasCloudToken ? 'saved' : '';
            this._geminiKey = keyStatus.hasGeminiKey ? 'saved' : '';
            this._openrouterKey = keyStatus.hasOpenRouterKey ? 'saved' : '';
            this._openaiKey = creds.hasOpenaiKey ? 'saved' : '';
            this._whisperModel = prefs.whisperModel || 'base.en';
            this._profileContext = await cheatingDaddy.storage.getProfileContext(storedProfile);

            this.requestUpdate();
        } catch (e) {
            console.error('Error loading MainView storage:', e);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.boundKeydownHandler);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.boundKeydownHandler);
        if (this._animId) cancelAnimationFrame(this._animId);
        if (this._startErrorTimer) {
            clearTimeout(this._startErrorTimer);
            this._startErrorTimer = null;
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('_mode')) {
            // Stop old animation when switching modes
            if (this._animId) {
                cancelAnimationFrame(this._animId);
                this._animId = null;
            }
        }
        if (changedProperties.has('selectedProfile')) {
            cheatingDaddy.storage.getProfileContext(this.selectedProfile).then(context => {
                this._profileContext = context;
                this.requestUpdate();
            });
        }
    }

    _initButtonAurora() {
        // Aurora start button removed for Talent Autocue tally plate.
        return;
    }

    _handleKeydown(e) {
        if (e.key === 'Escape' && this._showLocalHelp) {
            this._closeLocalHelp();
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            this._handleStart();
        }
    }

    // ── Persistence ──

    async _saveMode(mode) {
        this._mode = mode;
        this._tokenError = false;
        this._keyError = false;
        await cheatingDaddy.storage.updatePreference('providerMode', mode);
        this.requestUpdate();
    }

    async _saveToken(val) {
        this._token = val;
        this._tokenError = false;
        try {
            await cheatingDaddy.storage.setCredentials({ cloudToken: val });
        } catch (e) {}
        this.requestUpdate();
    }

    async _saveGeminiKey(val) {
        this._geminiKey = val;
        this._keyError = false;
        await cheatingDaddy.storage.setApiKey(val);
        this.requestUpdate();
    }

    async _saveOpenRouterKey(val) {
        this._openrouterKey = val;
        await cheatingDaddy.storage.setOpenRouterApiKey(val);
        this.requestUpdate();
    }

    async _saveOpenaiKey(val) {
        this._openaiKey = val;
        try {
            await cheatingDaddy.storage.setCredentials({ openaiKey: val });
        } catch (e) {}
        this.requestUpdate();
    }

    async _saveWhisperModel(val) {
        this._whisperModel = val;
        await cheatingDaddy.storage.updatePreference('whisperModel', val);
        this.requestUpdate();
    }

    async _selectProfile(profileId) {
        const nextProfile = normalizeProfileId(profileId);
        if (nextProfile === this.selectedProfile) {
            return;
        }

        const previousProfile = this.selectedProfile;
        const previousContext = this._profileContext;
        this.onProfileChange(nextProfile);

        try {
            await cheatingDaddy.storage.setProfileContext(previousProfile, previousContext);
            this._profileContext = await cheatingDaddy.storage.getProfileContext(nextProfile);
        } catch (error) {
            console.error('Error switching session profile:', error);
        }

        this.requestUpdate();
    }

    async _saveProfileContext(value) {
        this._profileContext = value;
        await cheatingDaddy.storage.setProfileContext(this.selectedProfile, value);
    }

    _openLocalHelp() {
        this._showLocalHelp = true;
    }

    _closeLocalHelp() {
        this._showLocalHelp = false;
    }

    _handleHelpDialogClick(e) {
        e.stopPropagation();
    }

    _handleConfigToggle(e) {
        const section = e.target;
        if (!(section instanceof HTMLDetailsElement) || !section.open) return;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        requestAnimationFrame(() => {
            section.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    _handleAdvancedToggle(e) {
        const section = e.target;
        if (!(section instanceof HTMLDetailsElement)) return;
        this._advancedOpen = section.open;
        this._handleConfigToggle(e);
    }

    // ── Start ──

    _openAdvancedSettings() {
        this._advancedOpen = true;
    }

    showStartError(message) {
        if (this._startErrorTimer) {
            clearTimeout(this._startErrorTimer);
            this._startErrorTimer = null;
        }

        this._startError = message;
        this._openAdvancedSettings();
        this.requestUpdate();

        this._startErrorTimer = setTimeout(() => {
            this._startError = '';
            this._startErrorTimer = null;
            this.requestUpdate();
        }, 6000);
    }

    clearStartError() {
        if (this._startErrorTimer) {
            clearTimeout(this._startErrorTimer);
            this._startErrorTimer = null;
        }
        this._startError = '';
    }

    _handleStart() {
        if (!this.licenseValid) {
            this.onUnlock();
            return;
        }

        if (this.isInitializing || this.downloadProgress.active) return;

        this.clearStartError();

        if (this.requiresApiKeys) {
            if (this._mode === 'byok') {
                if (!this._geminiKey.trim()) {
                    this._keyError = true;
                    this.showStartError('Add your Gemini API key under Advanced to continue.');
                    return;
                }
            } else if (this._mode === 'whisper_openrouter') {
                const missingGemini = !this._geminiKey.trim();
                const missingOpenRouter = !this._openrouterKey.trim();
                if (missingGemini || missingOpenRouter) {
                    this._keyError = true;
                    if (missingGemini && missingOpenRouter) {
                        this.showStartError('Add your screen and live-answer API keys under Advanced to continue.');
                    } else if (missingOpenRouter) {
                        this.showStartError('Add your live-answer API key under Advanced to continue.');
                    } else {
                        this.showStartError('Add your screen API key under Advanced to continue.');
                    }
                    return;
                }
            }
        }

        this.onStart();
    }

    triggerApiKeyError(message = '') {
        this._keyError = this._mode !== 'local';
        if (message) {
            this.showStartError(message);
            return;
        }

        if (this._mode === 'whisper_openrouter' && this.requiresApiKeys) {
            this.showStartError('Check your API keys under Advanced, then try Start again.');
            return;
        }

        if (this._mode === 'whisper_openrouter' && !this.requiresApiKeys) {
            this.showStartError('AI access is not ready yet. Open Advanced for details or try again shortly.');
            return;
        }

        this.requestUpdate();
        setTimeout(() => {
            this._tokenError = false;
            this._keyError = false;
            this.requestUpdate();
        }, 2000);
    }

    // ── Render helpers ──

    _renderStartButton() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isDownloading = (this._mode === 'local' || this._mode === 'whisper_openrouter') && this.downloadProgress.active;
        const percentage = this.downloadProgress.percentage;
        const hasPercentage = Number.isFinite(percentage);

        const cmdIcon = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path
                d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
            />
        </svg>`;
        const ctrlIcon = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M6 15l6-6 6 6" />
        </svg>`;
        const enterIcon = html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M9 10l-5 5 5 5" />
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
        </svg>`;

        const startBlocked = this.licenseValid && (this.isInitializing || isDownloading);
        const profile = getSessionProfile(this.selectedProfile);
        const sessionStartLabel = profile.startLabel;
        const startLabel = !this.licenseValid
            ? 'Unlock to start'
            : isDownloading
              ? hasPercentage
                  ? `${percentage}%`
                  : 'Preparing...'
              : sessionStartLabel;

        return html`
            <div
                class="start-button ${startBlocked ? 'disabled' : ''}"
                role="button"
                tabindex=${startBlocked ? '-1' : '0'}
                aria-disabled=${startBlocked ? 'true' : 'false'}
                aria-label=${startLabel}
                @click=${() => this._handleStart()}
                @keydown=${e => {
                    if (startBlocked) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this._handleStart();
                    }
                }}
            >
                ${
                    isDownloading && this.licenseValid
                        ? html`<span
                              class="download-progress-fill ${hasPercentage ? '' : 'indeterminate'}"
                              style=${hasPercentage ? `transform: scaleX(${percentage / 100})` : ''}
                          ></span>`
                        : ''
                }
                <span class="btn-label">
                    ${startLabel}
                    ${this.licenseValid && !isDownloading ? html`<span class="shortcut-hint">${isMac ? cmdIcon : ctrlIcon}${enterIcon}</span>` : ''}
                </span>
            </div>
            ${
                isDownloading && this.licenseValid
                    ? html`
                          <div class="download-controls">
                              <span>Downloading: ${this.downloadProgress.label || 'Local AI files'}</span>
                              <button class="download-cancel" @click=${() => this.onCancelDownload()}>Cancel</button>
                          </div>
                      `
                    : ''
            }
            ${this._startError ? html`<div class="start-error" role="alert">${this._startError}</div>` : ''}
        `;
    }

    _renderDivider() {
        return html`
            <div class="divider">
                <div class="divider-line"></div>
                <span class="divider-text">or</span>
                <div class="divider-line"></div>
            </div>
        `;
    }

    _renderIncludedCheckIcon() {
        return html`
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 10.5 8.5 14 15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }

    _renderHostedAiIncludedBanner() {
        return html`
            <div class="included-banner" role="status">
                <div class="included-banner-icon">${this._renderIncludedCheckIcon()}</div>
                <div class="included-banner-copy">
                    <div class="included-banner-title">You're all set</div>
                    <div class="included-banner-text">Your pass is active. Add context above, then press Start.</div>
                </div>
            </div>
        `;
    }

    _renderLicenseRequiredCard() {
        return html`
            <div class="unlock-card">
                <div class="unlock-card-title">Pass required</div>
                <div class="unlock-card-text">Unlock a pass to start your session.</div>
                <button class="unlock-card-button" type="button" @click=${() => this.onUnlock()}>View passes from $15/mo</button>
            </div>
        `;
    }

    _renderActiveByokBanner() {
        return html`
            <div class="included-banner" role="status">
                <div class="included-banner-icon">${this._renderIncludedCheckIcon()}</div>
                <div class="included-banner-copy">
                    <div class="included-banner-title">Pass active</div>
                    <div class="included-banner-text">Add your API keys below to finish setup.</div>
                </div>
            </div>
        `;
    }

    _renderGeminiKeyField() {
        return html`
            <div class="form-group">
                <label class="form-label">Screen & voice key</label>
                <input
                    type="password"
                    placeholder="Paste your key"
                    class="${this._keyError ? 'error' : ''}"
                    .value=${this._geminiKey}
                    @input=${e => this._saveGeminiKey(e.target.value)}
                />
                <div class="form-hint">
                    <span class="link" @click=${() => this.onExternalLink('https://aistudio.google.com/apikey')}>Get a key</span>
                </div>
            </div>
        `;
    }

    _renderOpenRouterKeyField() {
        return html`
            <div class="form-group">
                <label class="form-label">Live answers key</label>
                <input
                    type="password"
                    placeholder="Paste your key"
                    class="${this._keyError ? 'error' : ''}"
                    .value=${this._openrouterKey}
                    @input=${e => this._saveOpenRouterKey(e.target.value)}
                />
                <div class="form-hint">
                    <span class="link" @click=${() => this.onExternalLink('https://openrouter.ai/keys')}>Get a key</span>
                </div>
            </div>
        `;
    }

    _renderAiAccessSection() {
        if (!this.licenseValid) {
            return this._renderLicenseRequiredCard();
        }

        if (!this.requiresApiKeys) {
            return this._renderHostedAiIncludedBanner();
        }

        return html` ${this._renderActiveByokBanner()} ${this._renderGeminiKeyField()} ${this._renderOpenRouterKeyField()} `;
    }

    // ── Cloud mode ──
    // Cloud UI intentionally disabled. Backend cloud wiring is still present in
    // the codebase, but the renderer no longer exposes this setup path.

    // ── BYOK mode ──

    _renderConfigChevron() {
        return html`
            <svg class="config-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `;
    }

    _renderByokMode() {
        return html`
            <details class="config-section" @toggle=${this._handleConfigToggle}>
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Screen & voice</span>
                        <span class="config-summary-description">Required API key</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">API key</label>
                        <input
                            type="password"
                            placeholder="Paste your key"
                            .value=${this._geminiKey}
                            @input=${e => this._saveGeminiKey(e.target.value)}
                            class=${this._keyError ? 'error' : ''}
                        />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://aistudio.google.com/apikey')}>Get a key</span>
                        </div>
                    </div>
                </div>
            </details>

            <details class="config-section" @toggle=${this._handleConfigToggle}>
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Live answers</span>
                        <span class="config-summary-description">Optional second key</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">API key</label>
                        <input
                            type="password"
                            placeholder="Optional"
                            .value=${this._openrouterKey}
                            @input=${e => this._saveOpenRouterKey(e.target.value)}
                        />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://openrouter.ai/keys')}>Get a key</span>
                        </div>
                    </div>
                </div>
            </details>

            ${this._renderStartButton()} ${this._renderDivider()}

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('whisper_openrouter')}>Back to default setup</button>
                <button class="mode-link" @click=${() => this._saveMode('local')}>Use offline mode</button>
            </div>
        `;
    }

    // ── Whisper + OpenRouter mode ──

    _renderProfileSelector() {
        const profiles = getPickerProfiles();
        return html`
            <div class="profile-list" role="listbox" aria-label="Session type">
                ${profiles.map(
                    profile => html`
                        <button
                            type="button"
                            class="profile-row ${this.selectedProfile === profile.id ? 'selected' : ''}"
                            role="option"
                            aria-selected=${this.selectedProfile === profile.id}
                            @click=${() => this._selectProfile(profile.id)}
                        >
                            <span class="profile-row-label">${profile.label}</span>
                            <span class="profile-row-desc">${profile.description}</span>
                        </button>
                    `
                )}
            </div>
        `;
    }

    _renderContextField() {
        const profile = getSessionProfile(this.selectedProfile);
        return html`
            <div class="form-group">
                <label class="form-label">${profile.contextLabel}</label>
                <textarea
                    class="context-area"
                    placeholder=${profile.contextPlaceholder}
                    .value=${this._profileContext}
                    @input=${e => this._saveProfileContext(e.target.value)}
                ></textarea>
            </div>
        `;
    }

    _renderAdvancedSection() {
        return html`
            <details class="config-section" ?open=${this._advancedOpen} @toggle=${this._handleAdvancedToggle}>
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Advanced</span>
                        <span class="config-summary-description">API keys and speech settings</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    ${this._renderAiAccessSection()}
                    <div class="form-group">
                        <div class="whisper-label-row">
                            <label class="form-label">Speech recognition</label>
                            ${this.whisperDownloading ? html`<div class="whisper-spinner"></div>` : ''}
                        </div>
                        <ui-select
                            full-width
                            .value=${this._whisperModel}
                            .options=${WHISPER_MODEL_OPTIONS}
                            ?disabled=${this.whisperDownloading}
                            @change=${e => this._saveWhisperModel(e.detail.value)}
                        ></ui-select>
                        <div class="form-hint">
                            ${this.whisperDownloading ? 'Downloading...' : 'Runs on your Mac. Downloads once on first start.'}
                        </div>
                    </div>
                </div>
            </details>
        `;
    }

    _renderWhisperOpenRouterMode() {
        return html`
            ${this._renderProfileSelector()} ${this._renderContextField()} ${this._renderStartButton()} ${this._renderAdvancedSection()}
        `;
    }

    // ── Local AI mode ──

    _renderLocalMode() {
        return html`
            <div class="config-note">Everything runs on your Mac. Files download on first start.</div>

            <details class="config-section" @toggle=${this._handleConfigToggle}>
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Speech recognition</span>
                        <span class="config-summary-description">Accuracy vs speed</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <div class="whisper-label-row">
                            <label class="form-label">Quality</label>
                            ${this.whisperDownloading ? html`<div class="whisper-spinner"></div>` : ''}
                        </div>
                        <ui-select
                            full-width
                            .value=${this._whisperModel}
                            .options=${WHISPER_MODEL_OPTIONS_LOCAL}
                            ?disabled=${this.whisperDownloading}
                            @change=${e => this._saveWhisperModel(e.detail.value)}
                        ></ui-select>
                        <div class="form-hint">${this.whisperDownloading ? 'Downloading...' : 'Downloaded automatically on first use'}</div>
                    </div>
                </div>
            </details>

            ${this._renderStartButton()} ${this._renderDivider()}

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('byok')}>Use your own API keys</button>
                <button class="mode-link" @click=${() => this._saveMode('whisper_openrouter')}>Back to default setup</button>
            </div>
        `;
    }

    // ── Main render ──

    render() {
        const licenseHint = !this.licenseValid
            ? 'Unlock a pass to start.'
            : !this.requiresApiKeys
              ? 'Add context above, then press Start.'
              : 'Add your API keys below, then press Start.';

        let modeContent;
        switch (this._mode) {
            case 'byok':
                modeContent = this._renderByokMode();
                break;
            case 'local':
                modeContent = this._renderLocalMode();
                break;
            case 'whisper_openrouter':
            default:
                modeContent = this._renderWhisperOpenRouterMode();
                break;
        }

        return html`
            <div class="form-scroll">
                <div class="form-wrapper">
                    <div class="page-title">What are you doing?</div>
                    <div class="page-subtitle">Know what to say next. ${licenseHint}</div>
                    ${modeContent}
                </div>
            </div>
        `;
    }

    _renderLocalHelp(closeIcon) {
        return html`
            <div class="help-dialog-backdrop" @click=${this._closeLocalHelp}>
                <section class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="local-help-title" @click=${this._handleHelpDialogClick}>
                    <div class="help-dialog-header">
                        <div id="local-help-title" class="help-dialog-title">Local AI setup</div>
                        <button class="help-btn" @click=${this._closeLocalHelp} aria-label="Close Local AI help">${closeIcon}</button>
                    </div>

                    <div class="help-content">
                        <div class="help-section">
                            <div class="help-section-title">Offline mode</div>
                            <div class="help-section-text">
                                Everything runs on your computer. No external service or extra apps are required.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">First-time setup</div>
                            <div class="help-section-text">
                                Required files download and verify automatically on first start. They stay in the Menace Agent config directory.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Downloads</div>
                            <div class="help-section-text">
                                Speech and answer models download automatically on first use and stay in the Menace Agent config directory.
                            </div>
                        </div>

                        <hr class="help-divider" />

                        <div class="help-section">
                            <div class="help-section-title">Computer hanging or slow?</div>
                            <div class="help-section-text">
                                Running models locally uses a lot of RAM and CPU. If your computer slows down or freezes, it's likely the LLM. Switch
                                back to BYOK mode if you want to use a hosted provider instead.
                            </div>
                        </div>

                        <button
                            class="help-cloud-btn"
                            @click=${() => {
                                this._closeLocalHelp();
                                this._saveMode('byok');
                            }}
                        >
                            Switch to BYOK
                        </button>
                    </div>
                </section>
            </div>
        `;
    }
}

customElements.define('main-view', MainView);
