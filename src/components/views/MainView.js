import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { getPickerProfiles, getSessionProfile, normalizeProfileId } from '../../config/sessionProfiles.js';

const FLASH_VISION_MODEL = 'Gemini 3.6 Flash';
const OPENROUTER_MODEL_LABELS = {
    'google/gemini-3.5-flash-lite': 'Gemini 3.5 Flash Lite',
    'google/gemini-3.5-flash': 'Gemini 3.5 Flash',
    'google/gemini-3.6-flash': 'Gemini 3.6 Flash',
    'google/gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite',
    'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
};

const WHISPER_MODEL_LABELS = {
    'tiny.en': 'Whisper Tiny',
    'base.en': 'Whisper Base',
    'small.en': 'Whisper Small',
};

function formatOpenRouterModelLabel(modelSlug) {
    if (!modelSlug) {
        return 'Gemini 3.5 Flash Lite';
    }

    return OPENROUTER_MODEL_LABELS[modelSlug] || modelSlug.split('/').pop().replace(/-/g, ' ');
}

function formatWhisperModelLabel(modelId) {
    return WHISPER_MODEL_LABELS[modelId] || 'Whisper';
}

export class MainView extends LitElement {
    static styles = css`
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
        }

        .config-section {
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-surface);
            overflow: hidden;
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

        .flash-panel {
            display: flex;
            flex-direction: column;
            gap: var(--space-sm);
            padding: 14px;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            background: var(--bg-surface);
        }

        .flash-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-sm);
        }

        .flash-panel-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
        }

        .flash-panel-subtitle {
            margin-top: 2px;
            font-size: var(--font-size-xs);
            color: var(--text-muted);
            line-height: var(--line-height);
        }

        .flash-panel-badge {
            flex: none;
            padding: 3px 8px;
            border-radius: var(--radius-sm);
            border: 1px solid rgba(196, 30, 58, 0.35);
            background: rgba(196, 30, 58, 0.12);
            color: #f3b8c3;
            font-size: 10px;
            font-weight: var(--font-weight-semibold);
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        .flash-model-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 2px;
        }

        .flash-model-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: var(--space-sm);
            align-items: baseline;
            padding-top: 8px;
            border-top: 1px solid var(--border);
        }

        .flash-model-row:first-child {
            padding-top: 0;
            border-top: none;
        }

        .flash-model-copy {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }

        .flash-model-role {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
            color: var(--text-secondary);
        }

        .flash-model-detail {
            font-size: 11px;
            color: var(--text-muted);
            line-height: var(--line-height);
        }

        .flash-model-name {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            text-align: right;
            white-space: nowrap;
        }

        .flash-panel-footnote {
            font-size: 11px;
            color: var(--text-muted);
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

        .readiness-strip {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
        }

        .readiness-cell {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 8px 10px;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            background: var(--bg-surface);
        }

        .readiness-name {
            font-size: 10px;
            font-weight: var(--font-weight-semibold);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--text-muted);
        }

        .readiness-value {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
        }

        .readiness-value.ready {
            color: var(--success);
        }

        .readiness-value.pending,
        .readiness-value.needs-keys,
        .readiness-value.needs-license,
        .readiness-value.denied {
            color: var(--warning);
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
            transition: background-color 150ms ease;
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

        .help-models {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .help-model {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
        }

        .help-model-name {
            font-family: var(--font-mono);
            font-size: 11px;
            color: var(--text-primary);
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
    `;

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
        hostedAi: { type: Boolean },
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
        _answerModel: { state: true },
        _showLocalHelp: { state: true },
        _profileContext: { state: true },
        _readiness: { state: true },
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
        this.hostedAi = false;
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
        this._answerModel = 'google/gemini-3.5-flash-lite';
        this._profileContext = '';
        this._readiness = null;

        this._animId = null;
        this._time = 0;
        this._mouseX = -1;
        this._mouseY = -1;

        this.boundKeydownHandler = this._handleKeydown.bind(this);
        this._loadFromStorage();
    }

    async _loadFromStorage() {
        try {
            const [prefs, creds, config] = await Promise.all([
                cheatingDaddy.storage.getPreferences(),
                cheatingDaddy.storage.getCredentials().catch(() => ({})),
                cheatingDaddy.storage.getConfig().catch(() => ({})),
            ]);

            this._mode = 'whisper_openrouter';
            if (prefs.providerMode !== 'whisper_openrouter') {
                await cheatingDaddy.storage.updatePreference('providerMode', 'whisper_openrouter');
            }

            // Load keys
            this._token = creds.cloudToken || '';
            this._geminiKey = (await cheatingDaddy.storage.getApiKey().catch(() => '')) || '';
            this._openrouterKey = (await cheatingDaddy.storage.getOpenRouterApiKey().catch(() => '')) || '';
            this._openaiKey = creds.openaiKey || '';
            this._whisperModel = prefs.whisperModel || 'base.en';
            this._answerModel = config.openrouterModel || 'google/gemini-3.5-flash-lite';
            this._profileContext = await cheatingDaddy.storage.getProfileContext(this.selectedProfile);

            this.requestUpdate();
        } catch (e) {
            console.error('Error loading MainView storage:', e);
        }
    }

    async _refreshReadiness() {
        if (!window.menaceElectron) {
            return;
        }
        try {
            const result = await window.menaceElectron.invoke('app:get-session-readiness');
            if (result?.success) {
                this._readiness = result.data;
                this.requestUpdate();
            }
        } catch (error) {
            console.warn('Could not load session readiness:', error);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.boundKeydownHandler);
        this._refreshReadiness();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.boundKeydownHandler);
        if (this._animId) cancelAnimationFrame(this._animId);
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
        if (changedProperties.has('licenseValid') || changedProperties.has('hostedAi')) {
            this._refreshReadiness();
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
            const creds = await cheatingDaddy.storage.getCredentials().catch(() => ({}));
            await cheatingDaddy.storage.setCredentials({ ...creds, cloudToken: val });
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
            const creds = await cheatingDaddy.storage.getCredentials().catch(() => ({}));
            await cheatingDaddy.storage.setCredentials({ ...creds, openaiKey: val });
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

        await cheatingDaddy.storage.setProfileContext(this.selectedProfile, this._profileContext);
        this.onProfileChange(nextProfile);
        this._profileContext = await cheatingDaddy.storage.getProfileContext(nextProfile);
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

    // ── Start ──

    _handleStart() {
        if (!this.licenseValid) {
            this.onUnlock();
            return;
        }

        if (this.isInitializing || this.downloadProgress.active) return;

        if (this._mode === 'byok') {
            if (!this._geminiKey.trim()) {
                this._keyError = true;
                this.requestUpdate();
                return;
            }
        } else if (this._mode === 'whisper_openrouter') {
            if (!this.hostedAi) {
                if (!this._geminiKey.trim() || !this._openrouterKey.trim()) {
                    this._keyError = true;
                    this.requestUpdate();
                    return;
                }
            }
        }

        this.onStart();
    }

    triggerApiKeyError() {
        this._keyError = this._mode !== 'local';
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

    _renderFlashModelsPanel({ badge = 'Auto-selected', footnote }) {
        const answerModel = formatOpenRouterModelLabel(this._answerModel);
        const whisperModel = formatWhisperModelLabel(this._whisperModel);

        return html`
            <section class="flash-panel" aria-label="Latest Flash models used by Menace Agent">
                <div class="flash-panel-header">
                    <div>
                        <div class="flash-panel-title">Latest Flash models</div>
                        <div class="flash-panel-subtitle">Fast Google Flash models, picked for fast live responses.</div>
                    </div>
                    <span class="flash-panel-badge">${badge}</span>
                </div>

                <div class="flash-model-list">
                    <div class="flash-model-row">
                        <div class="flash-model-copy">
                            <div class="flash-model-role">Live answers</div>
                            <div class="flash-model-detail">Streams short, conversational replies while you talk.</div>
                        </div>
                        <div class="flash-model-name">${answerModel}</div>
                    </div>

                    <div class="flash-model-row">
                        <div class="flash-model-copy">
                            <div class="flash-model-role">Screen context</div>
                            <div class="flash-model-detail">Reads slides, prompts, and code when you capture the screen.</div>
                        </div>
                        <div class="flash-model-name">${FLASH_VISION_MODEL}</div>
                    </div>

                    <div class="flash-model-row">
                        <div class="flash-model-copy">
                            <div class="flash-model-role">Transcription</div>
                            <div class="flash-model-detail">Runs locally on your Mac for low-latency speech-to-text.</div>
                        </div>
                        <div class="flash-model-name">${whisperModel}</div>
                    </div>
                </div>

                ${footnote ? html`<div class="flash-panel-footnote">${footnote}</div>` : ''}
            </section>
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
                    <div class="included-banner-title">You're all set — no API keys needed</div>
                    <div class="included-banner-text">
                        Your pass includes live AI answers and Gemini screen context. Press Start when you're ready.
                    </div>
                </div>
            </div>
        `;
    }

    _renderLicenseRequiredCard() {
        return html`
            <div class="unlock-card">
                <div class="unlock-card-title">Pass required to use Menace Agent</div>
                <div class="unlock-card-text">
                    A pass is required for every session — even if you bring your own API keys. Gemini Live and screen context
                    run through the app, so OpenRouter alone is not enough.
                </div>
                <button class="unlock-card-button" type="button" @click=${() => this.onUnlock()}>View passes from $15/mo</button>
            </div>
        `;
    }

    _renderActiveByokBanner() {
        return html`
            <div class="included-banner" role="status">
                <div class="included-banner-icon">${this._renderIncludedCheckIcon()}</div>
                <div class="included-banner-copy">
                    <div class="included-banner-title">Pass active — add your API keys</div>
                    <div class="included-banner-text">
                        Your BYOK pass unlocks the overlay. Add Gemini and OpenRouter keys below — you pay the model providers
                        directly.
                    </div>
                </div>
            </div>
        `;
    }

    _renderGeminiKeyField() {
        return html`
            <div class="form-group">
                <label class="form-label">Gemini API Key</label>
                <input
                    type="password"
                    placeholder="Required for screen context"
                    class="${this._keyError ? 'error' : ''}"
                    .value=${this._geminiKey}
                    @input=${e => this._saveGeminiKey(e.target.value)}
                />
                <div class="form-hint">
                    <span class="link" @click=${() => this.onExternalLink('https://aistudio.google.com/apikey')}>Get a Gemini key</span>
                    for screen context and Gemini Live.
                </div>
            </div>
        `;
    }

    _renderOpenRouterKeyField() {
        return html`
            <div class="form-group">
                <label class="form-label">OpenRouter API Key</label>
                <input
                    type="password"
                    placeholder="sk-or-..."
                    class="${this._keyError ? 'error' : ''}"
                    .value=${this._openrouterKey}
                    @input=${e => this._saveOpenRouterKey(e.target.value)}
                />
                <div class="form-hint">
                    <span class="link" @click=${() => this.onExternalLink('https://openrouter.ai/keys')}>Get an OpenRouter key</span>
                    for live responses.
                </div>
            </div>
        `;
    }

    _renderAiAccessSection() {
        if (!this.licenseValid) {
            return this._renderLicenseRequiredCard();
        }

        if (this.hostedAi) {
            return this._renderHostedAiIncludedBanner();
        }

        return html`
            ${this._renderActiveByokBanner()}
            ${this._renderGeminiKeyField()}
            ${this._renderOpenRouterKeyField()}
        `;
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
                        <span class="config-summary-title">Transcription</span>
                        <span class="config-summary-description">Gemini Live connection</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">Gemini API Key</label>
                        <input
                            type="password"
                            placeholder="Required"
                            .value=${this._geminiKey}
                            @input=${e => this._saveGeminiKey(e.target.value)}
                            class=${this._keyError ? 'error' : ''}
                        />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://aistudio.google.com/apikey')}>Get Gemini key</span>
                        </div>
                    </div>

                </div>
            </details>

            <details class="config-section" @toggle=${this._handleConfigToggle}>
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">AI responses</span>
                        <span class="config-summary-description">Optional OpenRouter key for faster answers</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <label class="form-label">OpenRouter API Key</label>
                        <input
                            type="password"
                            placeholder="Optional"
                            .value=${this._openrouterKey}
                            @input=${e => this._saveOpenRouterKey(e.target.value)}
                        />
                        <div class="form-hint">
                            <span class="link" @click=${() => this.onExternalLink('https://openrouter.ai/keys')}>Get OpenRouter key</span>
                        </div>
                    </div>

                    <div class="config-note">
                        Answers use Gemini Flash by default. Add an OpenRouter key only if you want a separate response provider.
                    </div>
                </div>
            </details>

            ${this._renderStartButton()} ${this._renderDivider()}

            <!-- Cloud promo intentionally removed from the active UI. -->

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('whisper_openrouter')}>Use Whisper + OpenRouter</button>
                <button class="mode-link" @click=${() => this._saveMode('local')}>Use fully local AI</button>
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

    _renderReadinessStrip() {
        if (!this._readiness) {
            return '';
        }

        const cells = [
            { name: 'Audio', value: this._readiness.audio },
            { name: 'Screen', value: this._readiness.screen },
            { name: 'AI', value: this._readiness.ai },
        ];

        return html`
            <div class="readiness-strip" aria-label="Session readiness">
                ${cells.map(
                    cell => html`
                        <div class="readiness-cell">
                            <span class="readiness-name">${cell.name}</span>
                            <span class="readiness-value ${cell.value?.state || ''}">${cell.value?.label || '—'}</span>
                        </div>
                    `
                )}
            </div>
        `;
    }

    _renderAdvancedSection() {
        const flashFootnote = this.hostedAi
            ? 'Your pass covers these models. We keep them updated automatically.'
            : 'Flash models are picked for you. Your API keys cover usage on Gemini and OpenRouter.';

        return html`
            <details class="config-section" @toggle=${this._handleConfigToggle}>
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">AI & transcription</span>
                        <span class="config-summary-description">Models, keys, and local Whisper</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    ${this._renderAiAccessSection()}
                    ${this._renderFlashModelsPanel({
                        badge: this.hostedAi ? 'Included' : this.licenseValid ? 'Your keys' : 'Preview',
                        footnote: flashFootnote,
                    })}
                    <div class="form-group">
                        <div class="whisper-label-row">
                            <label class="form-label">Speech recognition</label>
                            ${this.whisperDownloading ? html`<div class="whisper-spinner"></div>` : ''}
                        </div>
                        <select .value=${this._whisperModel} @change=${e => this._saveWhisperModel(e.target.value)}>
                            <option value="tiny.en" ?selected=${this._whisperModel === 'tiny.en'}>Tiny — fastest (75 MB)</option>
                            <option value="base.en" ?selected=${this._whisperModel === 'base.en'}>Base — recommended (142 MB)</option>
                            <option value="small.en" ?selected=${this._whisperModel === 'small.en'}>Small — most accurate (466 MB)</option>
                        </select>
                        <div class="form-hint">
                            ${
                                this.whisperDownloading
                                    ? 'Downloading Whisper model...'
                                    : 'Runs locally on your Mac. Downloads once on first start.'
                            }
                        </div>
                    </div>
                </div>
            </details>
        `;
    }

    _renderWhisperOpenRouterMode() {
        return html`
            ${this._renderProfileSelector()}
            ${this._renderContextField()}
            ${this._renderReadinessStrip()}
            ${this._renderStartButton()}
            ${this._renderAdvancedSection()}
        `;
    }

    // ── Local AI mode ──

    _renderLocalMode() {
        return html`
            <div class="config-note">Uses a balanced local model automatically. Download happens on first start.</div>

            <details class="config-section" @toggle=${this._handleConfigToggle}>
                <summary class="config-summary">
                    <span class="config-summary-text">
                        <span class="config-summary-title">Transcription</span>
                        <span class="config-summary-description">Whisper speech-to-text model</span>
                    </span>
                    ${this._renderConfigChevron()}
                </summary>
                <div class="config-content">
                    <div class="form-group">
                        <div class="whisper-label-row">
                            <label class="form-label">Whisper Model</label>
                            ${this.whisperDownloading ? html`<div class="whisper-spinner"></div>` : ''}
                        </div>
                        <select .value=${this._whisperModel} @change=${e => this._saveWhisperModel(e.target.value)}>
                            <option value="tiny.en" ?selected=${this._whisperModel === 'tiny.en'}>Tiny English (75 MB, fastest)</option>
                            <option value="base.en" ?selected=${this._whisperModel === 'base.en'}>Base English (142 MB)</option>
                            <option value="small.en" ?selected=${this._whisperModel === 'small.en'}>Small English (466 MB, most accurate)</option>
                        </select>
                        <div class="form-hint">${this.whisperDownloading ? 'Downloading model...' : 'Downloaded automatically on first use'}</div>
                    </div>
                </div>
            </details>

            ${this._renderStartButton()} ${this._renderDivider()}

            <!-- Cloud promo intentionally removed from the active UI. -->

            <div class="mode-links">
                <button class="mode-link" @click=${() => this._saveMode('byok')}>Use own API keys</button>
                <button class="mode-link" @click=${() => this._saveMode('whisper_openrouter')}>Use Whisper + OpenRouter</button>
            </div>
        `;
    }

    // ── Main render ──

    render() {
        const licenseHint = !this.licenseValid
            ? 'A pass is required to start. Full passes include AI; BYOK uses your own keys.'
            : this.hostedAi
              ? 'Your pass includes AI. Add context above, then start your session.'
              : 'Add your API keys under AI & transcription if needed, then start.';

        return html`
            <div class="form-scroll">
                <div class="form-wrapper">
                    <div class="page-title">What are you doing?</div>
                    <div class="page-subtitle">Know what to say next. ${licenseHint}</div>
                    ${this._renderWhisperOpenRouterMode()}
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
                            <div class="help-section-title">Native local AI</div>
                            <div class="help-section-text">
                                Menace Agent runs llama.cpp and whisper.cpp directly. Everything stays on your computer — no external AI service or
                                Ollama installation is required.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Automatic setup</div>
                            <div class="help-section-text">
                                The correct native runners, selected Whisper model, and language model are downloaded and checksum-verified on first
                                use. They are stored in the Menace Agent config directory.
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Default model</div>
                            <div class="help-models">
                                <div class="help-model">
                                    <span class="help-model-name">Qwen3.5 4B Q4_K_M</span><span>About 2.7 GB — balanced local quality and speed</span>
                                </div>
                            </div>
                        </div>

                        <div class="help-section">
                            <div class="help-section-title">Whisper</div>
                            <div class="help-section-text">
                                The selected whisper.cpp model is downloaded automatically once and kept in the config directory.
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
