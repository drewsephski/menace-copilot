import { html, css, LitElement } from '../../assets/lit-core-2.7.4.min.js';

export class AppUpdater extends LitElement {
    static properties = { state: { state: true }, actionError: { state: true } };
    static styles = css`
        :host {
            display: block;
            font-family: var(--font, sans-serif);
            -webkit-app-region: no-drag;
        }
        button {
            width: 100%;
            color: inherit;
            font: inherit;
            font-size: 12px;
            border: 1px solid #ffffff24;
            background: #ffffff08;
            border-radius: 8px;
            padding: 8px 10px;
            cursor: pointer;
        }
        button:hover:not(:disabled) {
            background: #ffffff14;
        }
        .release-link {
            margin-top: 6px;
            border-color: transparent;
            background: transparent;
            opacity: 0.78;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        .release-link:hover {
            opacity: 1;
        }
        button:focus-visible {
            outline: 2px solid #a7d7c5;
            outline-offset: 3px;
        }
        button:disabled {
            opacity: 0.65;
            cursor: default;
        }
        .version,
        .detail {
            font-size: 11px;
            line-height: 1.5;
            opacity: 0.7;
            margin-top: 6px;
            overflow-wrap: anywhere;
        }
        .error {
            color: #f2b6a8;
            opacity: 1;
        }
    `;
    constructor() {
        super();
        this.state = { status: 'idle', localVersion: '' };
        this.actionError = '';
    }
    connectedCallback() {
        super.connectedCallback();
        if (!window.menace) return;
        this._unsubscribe = window.menace.events.on('app:update-status', state => {
            this.state = state;
            this.actionError = '';
        });
        // Reading state does not trigger duplicate checks from multiple shells.
        window.menace.app
            .getUpdateStatus()
            .then(result => {
                if (this.isConnected && result?.success) this.state = result.data;
            })
            .catch(() => {
                this.actionError = 'Could not read update status.';
            });
    }
    disconnectedCallback() {
        this._unsubscribe?.();
        super.disconnectedCallback();
    }
    async handleAction() {
        this.actionError = '';
        try {
            const result = this.state.status === 'ready' ? await window.menace.app.installUpdate() : await window.menace.app.checkUpdates();
            if (!result?.success) this.actionError = result?.error || 'Update request failed. Please try again.';
            else if (result.data) this.state = result.data;
        } catch {
            this.actionError = 'Update request failed. Please try again.';
        }
    }
    async openLatestRelease() {
        this.actionError = '';
        try {
            const result = await window.menace.app.openLatestRelease();
            if (!result?.success) this.actionError = result?.error || 'Could not open the release page.';
        } catch {
            this.actionError = 'Could not open the release page.';
        }
    }
    render() {
        const { status, localVersion, error } = this.state;
        const labels = {
            idle: 'Check for updates',
            checking: 'Checking for updates…',
            downloading: 'Downloading update…',
            ready: 'Restart to update',
            installing: 'Restarting…',
            current: 'Check for updates',
            error: 'Retry update',
            unsupported: 'Updates unavailable',
        };
        return html`
            <button @click=${this.handleAction} ?disabled=${['checking', 'downloading', 'installing', 'unsupported'].includes(status)}>
                ${labels[status] || 'Check for updates'}
            </button>
            <div class="version" role="status">${localVersion ? `v${localVersion}` : ''}${status === 'current' ? ' · Up to date' : ''}</div>
            ${status === 'ready' ? html`<div class="detail">Update downloaded. Restart when you’re ready.</div>` : ''}
            ${status === 'error' ? html`<button class="release-link" @click=${this.openLatestRelease}>Open latest release</button>` : ''}
            ${this.actionError || error ? html`<div class="detail error" role="alert">${this.actionError || error}</div>` : ''}
        `;
    }
}
customElements.define('app-updater', AppUpdater);
