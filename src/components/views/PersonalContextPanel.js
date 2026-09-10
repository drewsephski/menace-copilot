import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';
import { clickableControlStyles, unifiedPageStyles } from './sharedPageStyles.js';
import { buildChatGPTPersonalContextExportPrompt } from '../../utils/personalContext/importPrompt.esm.js';
import '../ui/uiButton.js';
import '../ui/uiConfirmDialog.js';
import '../ui/uiToast.js';

const SOURCE_LABELS = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    manual: 'Manual',
    unknown: 'Unknown',
};

const CATEGORY_LABELS = {
    identity: 'Identity',
    background: 'Background',
    skills: 'Skills',
    career: 'Career',
    projects: 'Projects',
    goals: 'Goals',
    interests: 'Interests',
    preferences: 'Preferences',
    constraints: 'Constraints',
    recurringContext: 'Recurring commitments',
};

const FACT_ARRAY_KEYS = [
    'identity',
    'background',
    'skills',
    'career',
    'projects',
    'goals',
    'interests',
    'preferences',
    'constraints',
    'recurringContext',
];

const COMMUNICATION_KEYS = ['tone', 'formatPreferences', 'avoid'];

export class PersonalContextPanel extends LitElement {
    static styles = [
        clickableControlStyles,
        unifiedPageStyles,
        css`
            .personal-context-section {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
            }

            .personal-summary {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }

            .personal-meta {
                color: var(--text-secondary);
                font-size: var(--font-size-xs);
            }

            .personal-actions {
                display: flex;
                gap: var(--space-sm);
                flex-wrap: wrap;
                align-items: center;
            }

            .privacy-note {
                color: var(--text-secondary);
                font-size: var(--font-size-xs);
                line-height: 1.4;
            }

            .modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.55);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: var(--space-md);
                pointer-events: auto;
                overscroll-behavior: contain;
                animation: modal-fade-in 200ms ease;
            }

            .modal-panel {
                width: min(640px, 100%);
                max-height: min(80vh, 720px);
                overflow: hidden;
                background: var(--bg-surface);
                border: 1px solid var(--border);
                border-radius: var(--radius-md);
                padding: var(--space-md);
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
                min-height: 0;
                animation: modal-slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1);
            }

            .modal-body {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                overflow-x: hidden;
                overscroll-behavior: contain;
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
            }

            @keyframes modal-fade-in {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes modal-slide-in {
                from {
                    opacity: 0;
                    transform: translateY(8px) scale(0.98);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .modal-title {
                font-size: var(--font-size-md);
                color: var(--text-primary);
            }

            .modal-step {
                color: var(--text-secondary);
                font-size: var(--font-size-xs);
            }

            .import-steps {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
                padding: var(--space-sm);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--bg-elevated);
            }

            .import-steps ol {
                margin: 0;
                padding-left: 1.25rem;
                color: var(--text-primary);
                font-size: var(--font-size-sm);
                line-height: 1.5;
            }

            .import-steps li + li {
                margin-top: var(--space-xs);
            }

            .import-steps li::marker {
                color: var(--text-secondary);
            }

            .prompt-preview {
                margin-top: var(--space-xs);
            }

            .prompt-preview summary {
                cursor: pointer;
                color: var(--text-secondary);
                font-size: var(--font-size-xs);
                user-select: none;
            }

            .prompt-preview summary:hover {
                color: var(--text-primary);
            }

            .prompt-preview-text {
                display: block;
                margin: var(--space-xs) 0 0;
                height: 200px;
                max-height: 200px;
                min-height: 0;
                overflow-x: hidden;
                overflow-y: auto;
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                padding: var(--space-sm);
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                background: var(--bg-app);
                color: var(--text-secondary);
                font-family: var(--font-mono);
                font-size: 10px;
                line-height: 1.45;
                white-space: pre-wrap;
                word-break: break-word;
                user-select: text;
                cursor: text;
            }

            .paste-form {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
                min-height: 0;
            }

            .paste-label {
                display: block;
                color: var(--text-secondary);
                font-size: var(--font-size-sm);
                margin-bottom: var(--space-xs);
            }

            .paste-area {
                width: 100%;
                min-height: 200px;
                resize: vertical;
                line-height: 1.45;
                user-select: text !important;
                -webkit-user-select: text !important;
                cursor: text !important;
            }

            .modal-panel textarea.control {
                user-select: text !important;
                -webkit-user-select: text !important;
                cursor: text !important;
            }

            .modal-panel textarea.control,
            .modal-panel .paste-area {
                width: 100%;
            }

            .warning-list {
                margin: 0;
                padding-left: 1.2rem;
                color: var(--text-secondary);
                font-size: var(--font-size-xs);
            }

            .error-text {
                color: var(--danger);
                font-size: var(--font-size-xs);
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

            .view-grid {
                display: flex;
                flex-direction: column;
                gap: var(--space-sm);
            }

            .view-category {
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: var(--space-sm);
                background: var(--bg-elevated);
            }

            .view-category-title {
                font-size: var(--font-size-xs);
                color: var(--text-secondary);
                margin-bottom: var(--space-xs);
            }

            .view-fact {
                font-size: var(--font-size-sm);
                margin-bottom: 4px;
            }

            .view-fact-meta {
                color: var(--text-secondary);
                font-size: var(--font-size-xs);
            }
        `,
    ];

    static properties = {
        _metadata: { state: true },
        _modalMode: { state: true },
        _importStep: { state: true },
        _importPrompt: { state: true },
        _importText: { state: true },
        _preview: { state: true },
        _previewWarnings: { state: true },
        _previewErrors: { state: true },
        _viewContext: { state: true },
        _statusMessage: { state: true },
        _statusType: { state: true },
        _importSource: { state: true },
        _loadingView: { state: true },
        _loadingParse: { state: true },
        _loadingImport: { state: true },
        _loadingClear: { state: true },
        _loadingCopy: { state: true },
        _promptCopied: { state: true },
        _toastOpen: { state: true },
        _toastMessage: { state: true },
        _toastVariant: { state: true },
        _clearConfirmOpen: { state: true },
    };

    constructor() {
        super();
        this._metadata = { exists: false, factCount: 0, categories: [] };
        this._modalMode = null;
        this._importStep = 1;
        this._importPrompt = '';
        this._importText = '';
        this._preview = null;
        this._previewWarnings = [];
        this._previewErrors = [];
        this._viewContext = null;
        this._statusMessage = '';
        this._statusType = '';
        this._importSource = 'chatgpt';
        this._loadingView = false;
        this._loadingParse = false;
        this._loadingImport = false;
        this._loadingClear = false;
        this._loadingCopy = false;
        this._promptCopied = false;
        this._toastOpen = false;
        this._toastMessage = '';
        this._toastVariant = 'success';
        this._clearConfirmOpen = false;
        this._toastTimer = null;
        this._modalOverlayActive = false;
        this._handleEscapeKeydown = event => {
            if (event.key === 'Escape' && this._modalMode) {
                event.preventDefault();
                this._closeModal();
            }
        };
        this._refreshMetadata();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._setModalOverlayActive(false);
        document.removeEventListener('keydown', this._handleEscapeKeydown);
        if (this._toastTimer) {
            clearTimeout(this._toastTimer);
            this._toastTimer = null;
        }
    }

    _setModalOverlayActive(active) {
        const next = Boolean(active);
        if (this._modalOverlayActive === next) {
            return;
        }

        this._modalOverlayActive = next;
        document.documentElement.style.overflow = next ? 'hidden' : '';
        if (next) {
            document.addEventListener('keydown', this._handleEscapeKeydown);
        } else {
            document.removeEventListener('keydown', this._handleEscapeKeydown);
        }
        window.dispatchEvent(new CustomEvent('personal-context-modal-changed', { detail: { open: next } }));
        if (window.menace?.window?.setPersonalContextModalOpen) {
            window.menace.window.setPersonalContextModalOpen(next);
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('_modalMode')) {
            this._setModalOverlayActive(Boolean(this._modalMode));
        }
        if (
            changedProperties.has('_importStep') ||
            (changedProperties.has('_modalMode') && this._modalMode === 'import' && this._importStep === 2)
        ) {
            this._syncPasteTextarea();
        }
    }

    _getPasteTextarea() {
        return this.renderRoot?.querySelector('#personal-context-paste') ?? null;
    }

    _syncPasteTextarea() {
        if (this._importStep !== 2) {
            return;
        }
        const textarea = this._getPasteTextarea();
        if (textarea && textarea.value !== this._importText) {
            textarea.value = this._importText;
        }
    }

    _handleImportTextInput(event) {
        const target = event.target;
        if (event.type === 'paste') {
            queueMicrotask(() => {
                this._importText = target.value;
            });
            return;
        }
        this._importText = target.value;
    }

    _showToast(message, variant = 'success', duration = 3200) {
        if (this._toastTimer) {
            clearTimeout(this._toastTimer);
        }
        this._toastMessage = message;
        this._toastVariant = variant;
        this._toastOpen = true;
        this._toastTimer = setTimeout(() => {
            this._toastOpen = false;
            this.requestUpdate();
        }, duration);
        this.requestUpdate();
    }

    async _refreshMetadata() {
        try {
            this._metadata = await cheatingDaddy.storage.getPersonalContextMetadata();
            this.requestUpdate();
        } catch (error) {
            console.error('Error loading personal context metadata:', error);
        }
    }

    _countPreviewFacts(preview) {
        if (!preview) {
            return 0;
        }
        let total = 0;
        for (const key of FACT_ARRAY_KEYS) {
            total += Array.isArray(preview[key]) ? preview[key].length : 0;
        }
        if (preview.communication) {
            for (const key of COMMUNICATION_KEYS) {
                total += Array.isArray(preview.communication[key]) ? preview.communication[key].length : 0;
            }
        }
        return total;
    }

    _formatUpdatedDate(metadata) {
        const raw = metadata.importedAt || metadata.generatedAt;
        if (!raw) {
            return 'Unknown date';
        }
        const date = new Date(raw);
        if (Number.isNaN(date.getTime())) {
            return raw;
        }
        return date.toLocaleDateString();
    }

    _closeModal() {
        this._modalMode = null;
        this._importStep = 1;
        this._importText = '';
        this._preview = null;
        this._previewWarnings = [];
        this._previewErrors = [];
        this._viewContext = null;
        this._promptCopied = false;
        this.requestUpdate();
    }

    _loadImportPrompt() {
        this._importPrompt = buildChatGPTPersonalContextExportPrompt();
    }

    async _handleCopyPrompt() {
        if (this._loadingCopy) {
            return;
        }
        if (!this._importPrompt) {
            this._loadImportPrompt();
        }
        if (!this._importPrompt) {
            this._showToast('Could not load export prompt', 'error');
            return;
        }
        this._loadingCopy = true;
        this._promptCopied = false;
        this.requestUpdate();
        try {
            await navigator.clipboard.writeText(this._importPrompt);
            this._promptCopied = true;
            this._showToast('Prompt copied — paste in ChatGPT', 'success');
        } catch {
            this._showToast('Could not copy — use Preview and copy manually', 'error', 4500);
        } finally {
            this._loadingCopy = false;
            this.requestUpdate();
        }
    }

    _openChatGptImport() {
        this._modalMode = 'import';
        this._importStep = 1;
        this._importSource = 'chatgpt';
        this._importText = '';
        this._preview = null;
        this._previewWarnings = [];
        this._previewErrors = [];
        this._promptCopied = false;
        this._loadImportPrompt();
        this.requestUpdate();
    }

    _openManualImport() {
        this._modalMode = 'import';
        this._importStep = 2;
        this._importSource = 'manual';
        this._importPrompt = '';
        this._importText = '';
        this._preview = null;
        this._previewWarnings = [];
        this._previewErrors = [];
        this._promptCopied = false;
        this.requestUpdate();
    }

    _renderImportStepHeader(currentStep) {
        const labels = ['Copy prompt into ChatGPT', 'Paste JSON here', 'Review and save'];
        return html` <div class="modal-step">Step ${currentStep} of 3 · ${labels[currentStep - 1]}</div> `;
    }

    _renderChatGptStep() {
        return html`
            ${this._renderImportStepHeader(1)}
            <div class="import-steps">
                <ol>
                    <li>Open ChatGPT and start a new chat.</li>
                    <li>Click <strong>Copy prompt for ChatGPT</strong> below and paste it into ChatGPT.</li>
                    <li>When ChatGPT replies with JSON, click <strong>Next</strong> and paste that reply here.</li>
                </ol>
            </div>
            <div class="form-help">Menace does not connect to ChatGPT — you copy a prompt, then paste ChatGPT’s JSON response back.</div>
            <div class="personal-actions">
                <ui-button
                    variant="default"
                    ?loading=${this._loadingCopy}
                    ?success=${this._promptCopied && !this._loadingCopy}
                    loading-label="Copying…"
                    @ui-click=${this._handleCopyPrompt}
                >
                    Copy prompt for ChatGPT
                </ui-button>
            </div>
            ${
                this._importPrompt
                    ? html`
                          <details class="prompt-preview">
                              <summary>Preview copied text (optional)</summary>
                              <pre class="prompt-preview-text" tabindex="0" role="region" aria-label="Copied prompt preview">${this._importPrompt}</pre>
                          </details>
                      `
                    : ''
            }
            <div class="personal-actions">
                <ui-button
                    variant="secondary"
                    ?disabled=${this._loadingCopy}
                    @ui-click=${() => {
                    this._importStep = 2;
                }}
                >
                    Next: Paste ChatGPT’s response
                </ui-button>
                <ui-button variant="ghost" ?disabled=${this._loadingCopy} @ui-click=${this._closeModal}>Cancel</ui-button>
            </div>
        `;
    }

    _renderPasteStep() {
        return html`
            <div class="paste-form">
                ${this._renderImportStepHeader(2)}
                <label class="paste-label" for="personal-context-paste">Paste ChatGPT’s JSON response</label>
                <textarea
                    id="personal-context-paste"
                    name="importText"
                    class="control paste-area"
                    placeholder="Paste the JSON ChatGPT returned. A markdown \`\`\`json code block is fine too."
                    spellcheck="false"
                    autocomplete="off"
                    @input=${this._handleImportTextInput}
                    @paste=${this._handleImportTextInput}
                    @change=${this._handleImportTextInput}
                    @contextmenu=${e => e.stopPropagation()}
                ></textarea>
                ${this._previewErrors.length ? html`<div class="error-text">${this._previewErrors.join(' ')}</div>` : ''}
                <div class="personal-actions">
                    <ui-button
                        type="button"
                        variant="default"
                        ?loading=${this._loadingParse}
                        loading-label="Reviewing…"
                        @ui-click=${this._handleParseImport}
                    >
                        Review import
                    </ui-button>
                    ${
                        this._importSource === 'chatgpt'
                            ? html`<ui-button
                                  type="button"
                                  variant="outline"
                                  ?disabled=${this._loadingParse}
                                  @ui-click=${() => {
                                      this._importStep = 1;
                                  }}
                                  >Back</ui-button
                              >`
                            : ''
                    }
                    <ui-button type="button" variant="ghost" ?disabled=${this._loadingParse} @ui-click=${this._closeModal}>Cancel</ui-button>
                </div>
            </div>
        `;
    }

    _readImportText() {
        const textarea = this._getPasteTextarea();
        return textarea?.value ?? this._importText ?? '';
    }

    async _handleParseImport() {
        if (this._loadingParse) {
            return;
        }

        const importText = String(this._readImportText()).trim();
        this._importText = this._readImportText();

        if (!importText) {
            this._previewErrors = ['Paste the JSON response before reviewing.'];
            this.requestUpdate();
            return;
        }

        this._loadingParse = true;
        this._previewErrors = [];
        this.requestUpdate();
        try {
            const storage = window.cheatingDaddy?.storage;
            if (!storage?.parsePersonalContextImport) {
                throw new Error('Import service is unavailable. Restart the app and try again.');
            }

            const options = this._importSource === 'manual' ? { sourceOverride: 'manual' } : {};
            const result = await storage.parsePersonalContextImport(importText, options);
            if (!result?.success) {
                this._previewErrors = result?.errors || [result?.error || 'Import failed'];
                this._preview = null;
                this._previewWarnings = result?.warnings || [];
                this._importStep = 2;
                return;
            }

            this._preview = result.data;
            this._previewWarnings = result.warnings || [];
            this._previewErrors = [];
            this._importStep = 3;
        } catch (error) {
            this._previewErrors = [error instanceof Error ? error.message : 'Could not review import'];
            this._preview = null;
            this._importStep = 2;
        } finally {
            this._loadingParse = false;
            this.requestUpdate();
        }
    }

    async _handleConfirmImport() {
        if (!this._preview || this._loadingImport) {
            return;
        }

        this._loadingImport = true;
        this.requestUpdate();
        try {
            const result = await cheatingDaddy.storage.setPersonalContext(this._preview, {
                sourceOverride: this._preview.source || 'manual',
            });

            if (!result.success) {
                this._previewErrors = result.errors || [result.error || 'Could not save personal context'];
                this._showToast(this._previewErrors[0], 'error', 4500);
                return;
            }

            this._closeModal();
            this._showToast('Personal context imported', 'success');
            await this._refreshMetadata();
        } finally {
            this._loadingImport = false;
            this.requestUpdate();
        }
    }

    async _handleView() {
        if (this._loadingView) {
            return;
        }
        this._loadingView = true;
        this.requestUpdate();
        try {
            this._viewContext = await cheatingDaddy.storage.getPersonalContext();
            this._modalMode = 'view';
        } finally {
            this._loadingView = false;
            this.requestUpdate();
        }
    }

    _openClearConfirm() {
        if (this._loadingClear) {
            return;
        }
        this._clearConfirmOpen = true;
        this.requestUpdate();
    }

    _closeClearConfirm() {
        if (this._loadingClear) {
            return;
        }
        this._clearConfirmOpen = false;
        this.requestUpdate();
    }

    async _confirmClear() {
        if (this._loadingClear) {
            return;
        }
        this._loadingClear = true;
        this.requestUpdate();
        try {
            await cheatingDaddy.storage.clearPersonalContext();
            this._clearConfirmOpen = false;
            this._showToast('Personal context cleared', 'success');
            await this._refreshMetadata();
        } finally {
            this._loadingClear = false;
            this.requestUpdate();
        }
    }

    _renderFactList(entries) {
        if (!Array.isArray(entries) || entries.length === 0) {
            return html`<div class="view-fact-meta">No facts</div>`;
        }

        return entries.map(
            entry => html`
                <div class="view-fact">
                    ${entry.fact}
                    <span class="view-fact-meta">
                        ${entry.confidence === 'medium' ? ' · medium confidence' : ''} ${entry.lastKnown ? ` · as of ${entry.lastKnown}` : ''}
                    </span>
                </div>
            `
        );
    }

    _renderViewModal() {
        const context = this._viewContext;
        if (!context) {
            return '';
        }

        const categories = [];
        for (const key of FACT_ARRAY_KEYS) {
            if (Array.isArray(context[key]) && context[key].length > 0) {
                categories.push(html`
                    <div class="view-category">
                        <div class="view-category-title">${CATEGORY_LABELS[key]}</div>
                        ${this._renderFactList(context[key])}
                    </div>
                `);
            }
        }

        if (context.communication) {
            for (const key of COMMUNICATION_KEYS) {
                const entries = context.communication[key];
                if (Array.isArray(entries) && entries.length > 0) {
                    categories.push(html`
                        <div class="view-category">
                            <div class="view-category-title">Communication · ${key}</div>
                            ${this._renderFactList(entries)}
                        </div>
                    `);
                }
            }
        }

        return html`
            <div class="modal-backdrop" @click=${e => e.target === e.currentTarget && this._closeModal()}>
                <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="personal-context-view-title" @click=${e => e.stopPropagation()}>
                    <div id="personal-context-view-title" class="modal-title">Personal Context</div>
                    <div class="modal-body">
                        <div class="view-grid">${categories}</div>
                    </div>
                    <div class="personal-actions">
                        <ui-button variant="outline" @ui-click=${this._closeModal}>Close</ui-button>
                        <ui-button
                            variant="secondary"
                            @ui-click=${() => {
                                this._closeModal();
                                this._openManualImport();
                            }}
                            >Replace</ui-button
                        >
                    </div>
                </div>
            </div>
        `;
    }

    _renderImportModal() {
        return html`
            <div class="modal-backdrop" @click=${e => e.target === e.currentTarget && this._closeModal()}>
                <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="personal-context-import-title" @click=${e => e.stopPropagation()}>
                    <div id="personal-context-import-title" class="modal-title">Import Personal Context</div>
                    <div class="modal-body">
                        ${this._importStep === 1 ? this._renderChatGptStep() : ''} ${this._importStep === 2 ? this._renderPasteStep() : ''}
                        ${
                            this._importStep === 3 && this._preview
                                ? html`
                                      ${this._renderImportStepHeader(3)}
                                      <div class="personal-meta">
                                          Source: ${SOURCE_LABELS[this._preview.source] || this._preview.source}<br />
                                          Generated: ${this._preview.generatedAt || 'Not provided'}<br />
                                          Facts: ${this._countPreviewFacts(this._preview)} · Categories:
                                          ${
                                              (this._preview.identity?.length ? 'identity ' : '') +
                                              (this._preview.career?.length ? 'career ' : '') +
                                              (this._preview.projects?.length ? 'projects ' : '')
                                          }
                                      </div>
                                      ${
                                          this._previewWarnings.length
                                              ? html`<ul class="warning-list">
                                                    ${this._previewWarnings.slice(0, 8).map(w => html`<li>${w}</li>`)}
                                                </ul>`
                                              : ''
                                      }
                                      <div class="form-help">Importing replaces any existing Personal Context snapshot (does not append duplicates).</div>
                                      <div class="personal-actions">
                                          <ui-button
                                              variant="default"
                                              ?loading=${this._loadingImport}
                                              loading-label="Saving…"
                                              @ui-click=${this._handleConfirmImport}
                                              >Import</ui-button
                                          >
                                          <ui-button
                                              variant="outline"
                                              ?disabled=${this._loadingImport}
                                              @ui-click=${() => {
                                                  this._importStep = 2;
                                              }}
                                              >Back</ui-button
                                          >
                                          <ui-button variant="ghost" ?disabled=${this._loadingImport} @ui-click=${this._closeModal}>Cancel</ui-button>
                                      </div>
                                  `
                                : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }

    _renderModal() {
        if (!this._modalMode) {
            return '';
        }

        if (this._modalMode === 'import') {
            return this._renderImportModal();
        }

        return this._renderViewModal();
    }

    render() {
        const metadata = this._metadata || { exists: false };

        return html`
            <section class="surface personal-context-section">
                <div class="surface-title">Personal Context</div>
                <div class="form-help">
                    Give Menace context about you once, and it can use your real background, preferences, projects, and goals across conversations.
                </div>
                <div class="privacy-note">
                    Stored locally. Relevant context is sent to your selected AI provider only when needed to generate a response.
                </div>

                ${
                    metadata.exists
                        ? html`
                              <div class="personal-summary">
                                  <div>${metadata.factCount} facts</div>
                                  <div class="personal-meta">
                                      Imported from ${SOURCE_LABELS[metadata.source] || metadata.source || 'Unknown'} · Updated
                                      ${this._formatUpdatedDate(metadata)}
                                  </div>
                              </div>
                              <div class="personal-actions">
                                  <ui-button variant="outline" ?loading=${this._loadingView} loading-label="Loading…" @ui-click=${this._handleView}
                                      >View</ui-button
                                  >
                                  <ui-button variant="secondary" @ui-click=${this._openChatGptImport}>Replace</ui-button>
                                  <ui-button variant="destructive" @ui-click=${this._openClearConfirm}>Clear</ui-button>
                              </div>
                          `
                        : html`
                              <div class="form-help">
                                  Menace can use a personal profile to make responses sound more like you and answer from your actual background.
                              </div>
                              <div class="personal-actions">
                                  <ui-button variant="default" @ui-click=${this._openChatGptImport}>Import from ChatGPT</ui-button>
                                  <ui-button variant="outline" @ui-click=${this._openManualImport}>Paste context manually</ui-button>
                              </div>
                          `
                }
                ${
                    this._statusMessage
                        ? html`<div class="status ${this._statusType === 'success' ? 'success' : 'error'}">${this._statusMessage}</div>`
                        : ''
                }
            </section>

            ${this._renderModal()}

            <ui-confirm-dialog
                ?open=${this._clearConfirmOpen}
                title="Clear personal context?"
                description="This removes your saved facts from this Mac. You can import context again anytime."
                confirm-label="Clear"
                cancel-label="Cancel"
                tone="delete"
                ?loading=${this._loadingClear}
                loading-label="Clearing…"
                @confirm=${this._confirmClear}
                @cancel=${this._closeClearConfirm}
            ></ui-confirm-dialog>

            <ui-toast
                ?open=${this._toastOpen}
                message=${this._toastMessage}
                variant=${this._toastVariant}
                @dismiss=${() => {
                    this._toastOpen = false;
                }}
            ></ui-toast>
        `;
    }
}

customElements.define('personal-context-panel', PersonalContextPanel);
